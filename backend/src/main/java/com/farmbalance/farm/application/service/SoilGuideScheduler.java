package com.farmbalance.farm.application.service;

import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 토양 기반 영농 가이드 알림 스케줄러.
 * 매일 10:00에 실행되며 ACTIVE 상태 재배 등록의 농장 토양 정보(pH, 유기물)와
 * 작물별 최적 범위(crop_cultivation_env)를 비교하여 부적합한 경우 GUIDE 알림을 발송합니다.
 * 같은 달에 동일 제목의 알림이 이미 발송된 경우 중복 발송하지 않습니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SoilGuideScheduler {

    private final NotificationUseCase notificationUseCase;
    private final JdbcTemplate jdbcTemplate;

    // 유기물 부족 임계값 비율 (작물 최적치의 70% 미만이면 부족 판정)
    private static final double ORGANIC_MATTER_DEFICIENCY_RATIO = 0.7;

    @Scheduled(cron = "0 0 10 * * *")
    public void checkSoilSuitability() {
        log.info("[SoilGuide] 토양 적합도 알림 체크 시작");

        List<Map<String, Object>> rows = loadCultivationsWithSoil();
        log.info("[SoilGuide] 토양 정보 있는 ACTIVE 재배 등록 수: {}건", rows.size());

        int alertCount = 0;
        for (Map<String, Object> row : rows) {
            alertCount += processSoilAlerts(row);
        }

        log.info("[SoilGuide] 토양 적합도 알림 체크 완료 - 발송: {}건", alertCount);
    }

    private int processSoilAlerts(Map<String, Object> row) {
        Long userId = (Long) row.get("user_id");
        String cropName = (String) row.get("crop_name");
        String farmName = (String) row.get("farm_name");
        Double soilPh = toDouble(row.get("soil_ph"));
        Double soilOm = toDouble(row.get("soil_organic_matter"));
        Double optPhMin = toDouble(row.get("optimal_ph_min"));
        Double optPhMax = toDouble(row.get("optimal_ph_max"));
        Double optOm = toDouble(row.get("optimal_om"));

        int sent = 0;
        sent += checkPh(userId, cropName, farmName, soilPh, optPhMin, optPhMax);
        sent += checkOrganicMatter(userId, cropName, farmName, soilOm, optOm);
        return sent;
    }

    /** pH 부적합 알림 — 작물 최적 범위를 벗어난 경우 */
    private int checkPh(Long userId, String cropName, String farmName,
                         Double soilPh, Double optMin, Double optMax) {
        if (soilPh == null || optMin == null || optMax == null) return 0;

        String title;
        String message;
        if (soilPh < optMin) {
            title = String.format("[%s] 토양 pH 부적합 (산성)", farmName);
            message = String.format(
                    "%s 농장 토양 pH가 %.1f로 %s 적정 범위(%.1f~%.1f) 이하입니다. 석회(고토석회) 시용으로 산성 토양을 중화해주세요.",
                    farmName, soilPh, cropName, optMin, optMax);
        } else if (soilPh > optMax) {
            title = String.format("[%s] 토양 pH 부적합 (알칼리)", farmName);
            message = String.format(
                    "%s 농장 토양 pH가 %.1f로 %s 적정 범위(%.1f~%.1f) 이상입니다. 황(유황) 시용 또는 산성 비료로 pH를 낮춰주세요.",
                    farmName, soilPh, cropName, optMin, optMax);
        } else {
            return 0;
        }

        if (alreadySentThisMonth(userId, title)) return 0;

        notificationUseCase.createNotification(
                userId,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_SOIL,
                title,
                message,
                "/farm"
        );
        log.info("[SoilGuide] pH 알림 발송 - userId={}, 농장={}, pH={}", userId, farmName, soilPh);
        return 1;
    }

    /** 유기물 부족 알림 — 작물 최적치의 70% 미만인 경우 */
    private int checkOrganicMatter(Long userId, String cropName, String farmName,
                                    Double soilOm, Double optOm) {
        if (soilOm == null || optOm == null || optOm <= 0) return 0;
        if (soilOm >= optOm * ORGANIC_MATTER_DEFICIENCY_RATIO) return 0;

        String title = String.format("[%s] 토양 유기물 부족", farmName);
        String message = String.format(
                "%s 농장 토양 유기물이 %.1f%%로 %s 적정량(%.1f%%) 대비 부족합니다. 완숙 퇴비나 녹비작물 시용을 권고합니다.",
                farmName, soilOm, cropName, optOm);

        if (alreadySentThisMonth(userId, title)) return 0;

        notificationUseCase.createNotification(
                userId,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_SOIL,
                title,
                message,
                "/farm"
        );
        log.info("[SoilGuide] 유기물 알림 발송 - userId={}, 농장={}, OM={}%", userId, farmName, soilOm);
        return 1;
    }

    private List<Map<String, Object>> loadCultivationsWithSoil() {
        String sql = """
                SELECT cr.id,
                       c.name              AS crop_name,
                       f.user_id           AS user_id,
                       f.name              AS farm_name,
                       f.soil_ph           AS soil_ph,
                       f.soil_organic_matter AS soil_organic_matter,
                       cev.optimal_ph_min  AS optimal_ph_min,
                       cev.optimal_ph_max  AS optimal_ph_max,
                       cev.organic_matter  AS optimal_om
                FROM cultivation_registrations cr
                JOIN crops c ON cr.crop_id = c.id
                JOIN farms f ON cr.farm_id = f.id
                LEFT JOIN crop_cultivation_env cev ON cev.crop_name = c.name
                WHERE cr.status = 'ACTIVE'
                  AND cr.deleted_at IS NULL
                  AND f.deleted_at IS NULL
                  AND (f.soil_ph IS NOT NULL OR f.soil_organic_matter IS NOT NULL)
                """;
        return jdbcTemplate.queryForList(sql);
    }

    private boolean alreadySentThisMonth(Long userId, String title) {
        String sql = """
                SELECT COUNT(*) FROM notifications
                WHERE user_id = ?
                  AND title = ?
                  AND created_at >= DATE_TRUNC('month', NOW())
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, title);
        return count != null && count > 0;
    }

    private Double toDouble(Object o) {
        if (o == null) return null;
        if (o instanceof Double d) return d;
        if (o instanceof Number n) return n.doubleValue();
        if (o instanceof BigDecimal bd) return bd.doubleValue();
        try {
            return Double.parseDouble(o.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
