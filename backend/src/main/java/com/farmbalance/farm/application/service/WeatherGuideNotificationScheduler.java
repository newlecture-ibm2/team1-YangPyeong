package com.farmbalance.farm.application.service;

import com.farmbalance.farm.domain.WeatherData;
import com.farmbalance.global.event.WeatherAlertEvent;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 기상 데이터 기반 영농 가이드 알림 발송 컴포넌트.
 * DailyWeatherRecordService가 발행한 WeatherAlertEvent를 수신하여
 * 5가지 기상 조건을 판단하고 해당 농부들에게 GUIDE 타입 알림을 발송합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherGuideNotificationScheduler {

    private final NotificationUseCase notificationUseCase;
    private final JdbcTemplate jdbcTemplate;

    // 서리 위험 기준 최저 기온 (°C)
    private static final double FROST_THRESHOLD = 2.0;
    // 폭염 기준 최고 기온 (°C)
    private static final double HEAT_WAVE_THRESHOLD = 33.0;
    // 집중호우 기준 일 강수량 (mm)
    private static final double HEAVY_RAIN_THRESHOLD = 50.0;
    // 가뭄 주의 기준 7일 누적 강수량 (mm)
    private static final double DROUGHT_7DAY_THRESHOLD = 10.0;
    // 고습 기준 평균 상대습도 (%)
    private static final double HIGH_HUMIDITY_THRESHOLD = 90.0;

    @Async("eventTaskExecutor")
    @EventListener
    public void onWeatherAlert(WeatherAlertEvent event) {
        WeatherData w = event.weatherData();
        LocalDate date = event.date();
        log.info("[WeatherGuide] 기상 알림 조건 체크 시작 - 날짜: {}, 최저:{} 최고:{} 강수:{} 습도:{}",
                date, w.getMinTa(), w.getMaxTa(), w.getSumRn(), w.getAvgRhm());

        List<Long> farmerIds = getAllFarmerIds();
        if (farmerIds.isEmpty()) {
            log.info("[WeatherGuide] 등록 농부가 없어 알림을 건너뜁니다.");
            return;
        }

        checkFrost(w, farmerIds);
        checkHeatWave(w, farmerIds);
        checkHeavyRain(w, farmerIds);
        checkDrought(date, farmerIds);
        checkHighHumidity(w, farmerIds);
    }

    /** 서리 위험: 최저기온 2°C 이하 */
    private void checkFrost(WeatherData w, List<Long> farmerIds) {
        if (w.getMinTa() == null || w.getMinTa() > FROST_THRESHOLD) return;

        log.info("[WeatherGuide] 서리 위험 감지 - 최저기온: {}°C", w.getMinTa());
        notificationUseCase.createBulkNotifications(
                farmerIds,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_WEATHER,
                "서리 위험 주의",
                String.format("최저기온이 %.1f°C로 서리 피해 위험이 있습니다. 보온 덮개 설치 및 작물 보온 조치를 취해주세요.", w.getMinTa()),
                "/mypage/notifications"
        );
    }

    /** 폭염 주의: 최고기온 33°C 이상 */
    private void checkHeatWave(WeatherData w, List<Long> farmerIds) {
        if (w.getMaxTa() == null || w.getMaxTa() < HEAT_WAVE_THRESHOLD) return;

        log.info("[WeatherGuide] 폭염 감지 - 최고기온: {}°C", w.getMaxTa());
        notificationUseCase.createBulkNotifications(
                farmerIds,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_WEATHER,
                "폭염 주의",
                String.format("최고기온이 %.1f°C까지 오를 예정입니다. 충분한 관수와 차광 조치를 취하고 이른 아침이나 저녁에 작업하세요.", w.getMaxTa()),
                "/mypage/notifications"
        );
    }

    /** 집중호우 주의: 일 강수량 50mm 이상 */
    private void checkHeavyRain(WeatherData w, List<Long> farmerIds) {
        if (w.getSumRn() == null || w.getSumRn() < HEAVY_RAIN_THRESHOLD) return;

        log.info("[WeatherGuide] 집중호우 감지 - 강수량: {}mm", w.getSumRn());
        notificationUseCase.createBulkNotifications(
                farmerIds,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_WEATHER,
                "집중호우 주의",
                String.format("하루 강수량이 %.0fmm를 기록했습니다. 배수로를 점검하고 침수 피해에 대비해주세요.", w.getSumRn()),
                "/mypage/notifications"
        );
    }

    /** 가뭄 주의: 최근 7일 누적 강수량 10mm 미만 */
    private void checkDrought(LocalDate date, List<Long> farmerIds) {
        try {
            // cultivation_history 테이블에서 최근 7일 강수량 합산 조회 (농장별 중복 제거를 위해 날짜별 평균 사용)
            String sql = """
                    SELECT COALESCE(AVG(daily_rain), 0)
                    FROM (
                        SELECT record_date, AVG(total_rain) AS daily_rain
                        FROM cultivation_history
                        WHERE record_date >= ? AND record_date < ?
                          AND total_rain IS NOT NULL
                        GROUP BY record_date
                    ) daily
                    """;
            LocalDate sevenDaysAgo = date.minusDays(7);
            Double sevenDayAvgRain = jdbcTemplate.queryForObject(sql, Double.class, sevenDaysAgo, date);
            double totalRain = (sevenDayAvgRain == null ? 0.0 : sevenDayAvgRain) * 7;

            log.info("[WeatherGuide] 최근 7일 추정 누적 강수량: {}mm", String.format("%.1f", totalRain));

            if (totalRain >= DROUGHT_7DAY_THRESHOLD) return;

            log.info("[WeatherGuide] 가뭄 주의 감지 - 7일 누적 강수량: {}mm", String.format("%.1f", totalRain));
            notificationUseCase.createBulkNotifications(
                    farmerIds,
                    NotificationType.GUIDE,
                    NotificationCategory.GUIDE_WEATHER,
                    "가뭄 주의 — 관수 권고",
                    String.format("최근 7일 강수량이 %.0fmm로 부족합니다. 토양 수분을 확인하고 정기적인 관수를 실시해주세요.", totalRain),
                    "/mypage/notifications"
            );
        } catch (Exception e) {
            log.warn("[WeatherGuide] 가뭄 조건 조회 실패: {}", e.getMessage());
        }
    }

    /** 고습 주의: 평균 상대습도 90% 이상 */
    private void checkHighHumidity(WeatherData w, List<Long> farmerIds) {
        if (w.getAvgRhm() == null || w.getAvgRhm() < HIGH_HUMIDITY_THRESHOLD) return;

        log.info("[WeatherGuide] 고습 감지 - 평균 습도: {}%", w.getAvgRhm());
        notificationUseCase.createBulkNotifications(
                farmerIds,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_WEATHER,
                "고습 주의 — 병해충 예방",
                String.format("평균 습도가 %.0f%%로 높습니다. 환기를 강화하고 곰팡이병·노균병 등 병해충 예방 방제를 실시해주세요.", w.getAvgRhm()),
                "/mypage/notifications"
        );
    }

    private List<Long> getAllFarmerIds() {
        try {
            return jdbcTemplate.queryForList(
                    "SELECT DISTINCT user_id FROM farms WHERE deleted_at IS NULL",
                    Long.class
            );
        } catch (Exception e) {
            log.error("[WeatherGuide] 농부 목록 조회 실패", e);
            return new ArrayList<>();
        }
    }
}
