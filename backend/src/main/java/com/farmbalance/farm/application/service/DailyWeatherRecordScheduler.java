package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.batch.BatchLogService;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.HealthCheckTriggerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyWeatherRecordScheduler {

    private final DailyWeatherRecordService dailyWeatherRecordService;
    private final WeatherRecordPort weatherRecordPort;
    private final BatchLogService batchLogService;
    private final ApplicationEventPublisher eventPublisher;
    private final ManageApiSyncUseCase manageApiSyncUseCase;

    private static final int YANGPYEONG_STN_ID = 202; // 양평군 ASOS 지점번호

    // 매일 낮 12시에 실행 (기상청 전일 데이터 갱신 시간 등 지연 고려)
    @Scheduled(cron = "0 0 12 * * *")
    public void recordDailyWeather() {
        try {
            ApiSyncStatus status = manageApiSyncUseCase.getApiSyncStatusByName("WEATHER_RECORD");
            if (status != null && !status.getIsActive()) {
                log.info("[Scheduler] WEATHER_RECORD API가 비활성화되어 있어 스케줄러를 종료합니다.");
                return;
            }
        } catch (Exception e) {
            log.warn("[Scheduler] API 상태 조회 실패. (기본 동작 수행)");
        }

        try {
            batchLogService.execute("WEATHER_RECORD", dailyWeatherRecordService::doRecordDailyWeather);
        } catch (Exception e) {
            log.error("[Scheduler] 기상청 일일 데이터 수집 스케줄러 실패", e);
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_RECORD", "FAILED", 0, e.getMessage()));
        }
    }

    @Async
    @EventListener
    public void onHealthCheckTriggerEvent(HealthCheckTriggerEvent event) {
        if (!"WEATHER_RECORD".equals(event.apiName())) {
            return;
        }
        log.info("[Scheduler] 기상청 헬스체크 지시 수신");
        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            weatherRecordPort.fetchAsosDailyWeather(YANGPYEONG_STN_ID, yesterday);
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_RECORD", "SUCCESS", 0, null, true));
        } catch (Exception e) {
            log.error("[Scheduler] 기상청 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_RECORD", "FAILED", 0, e.getMessage(), true));
        }
    }
}
