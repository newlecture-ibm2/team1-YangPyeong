package com.farmbalance.farm.application.service;

import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 병해충 발생 시기 알림 스케줄러.
 * 매일 09:30에 실행되며 농사로 nongsaro_farm_schedules(info_type_code=410002)에서
 * 이달 병해충 발생 위험 시기를 조회하여 해당 작물 재배 농부에게 GUIDE 알림을 발송합니다.
 * 같은 달에 동일 제목의 알림이 이미 발송된 경우 중복 발송하지 않습니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PestAlertScheduler {

    private final NotificationUseCase notificationUseCase;
    private final JdbcTemplate jdbcTemplate;

    // 병해충으로 판단하는 operation_name 키워드
    private static final List<String> PEST_KEYWORDS = List.of("병", "충", "해충", "역병", "탄저", "노균", "도열", "흰가루");
    // 기상재해(가뭄, 장마 등)로 판단하여 제외할 키워드
    private static final List<String> WEATHER_KEYWORDS = List.of("가뭄", "장마", "잦은비", "폭염", "냉해", "태풍", "서리");

    @Scheduled(cron = "0 30 9 * * *")
    public void checkPestAlerts() {
        int currentMonth = LocalDate.now().getMonthValue();
        log.info("[PestAlert] 병해충 주의보 알림 체크 시작 - {}월", currentMonth);

        List<Map<String, Object>> activeCultivations = loadActiveCultivations();
        if (activeCultivations.isEmpty()) {
            log.info("[PestAlert] ACTIVE 재배 등록이 없어 알림을 건너뜁니다.");
            return;
        }

        // 사용자별 재배 작물 그룹화
        Map<Long, List<String>> userCropMap = activeCultivations.stream()
                .collect(Collectors.groupingBy(
                        row -> (Long) row.get("user_id"),
                        Collectors.mapping(row -> (String) row.get("crop_name"), Collectors.toList())
                ));

        for (Map.Entry<Long, List<String>> entry : userCropMap.entrySet()) {
            Long userId = entry.getKey();
            // 동일 사용자가 같은 작물을 여러 농장에서 재배할 수 있으므로 중복 제거
            List<String> cropNames = entry.getValue().stream().distinct().collect(Collectors.toList());

            for (String cropName : cropNames) {
                processPestAlert(userId, cropName, currentMonth);
            }
        }

        log.info("[PestAlert] 병해충 주의보 알림 체크 완료");
    }

    private void processPestAlert(Long userId, String cropName, int currentMonth) {
        List<String> pestRisks = loadCurrentMonthPestRisks(cropName, currentMonth);
        if (pestRisks.isEmpty()) {
            return;
        }

        String title = String.format("[%s] 병해충 주의보", cropName);
        if (alreadySentThisMonth(userId, title)) {
            return;
        }

        String riskSummary = pestRisks.stream()
                .limit(3)
                .map(op -> op.replaceAll("<br ?/?>", " ").replaceAll("\\s+", " ").trim())
                .collect(Collectors.joining(", "));

        notificationUseCase.createNotification(
                userId,
                NotificationType.GUIDE,
                NotificationCategory.GUIDE_PEST,
                title,
                String.format("이달 %s 재배지에 %s 발생 주의 시기입니다. 예방 방제를 실시해주세요.", cropName, riskSummary),
                "/farm"
        );
        log.info("[PestAlert] 병해충 알림 발송 - userId={}, 작물={}, 위험={}", userId, cropName, riskSummary);
    }

    /**
     * 현재 월에 해당하는 작물의 병해충 발생 항목 조회.
     * info_type_code = '410002' (기상재해 및 예상되는 문제점) 중
     * operation_name에 병/충 관련 키워드가 포함된 것만 필터링합니다.
     */
    private List<String> loadCurrentMonthPestRisks(String cropName, int month) {
        String sql = """
                SELECT DISTINCT operation_name
                FROM nongsaro_farm_schedules
                WHERE farm_work_type = ?
                  AND info_type_code = '410002'
                  AND CAST(start_month AS INT) <= ?
                  AND CAST(end_month AS INT) >= ?
                  AND deleted_at IS NULL
                """;
        List<String> allRisks = jdbcTemplate.queryForList(sql, String.class, cropName, month, month);

        return allRisks.stream()
                .filter(this::isPestRelated)
                .collect(Collectors.toList());
    }

    private boolean isPestRelated(String operationName) {
        if (operationName == null) return false;
        String normalized = operationName.replaceAll("\\s+", "");
        // 기상재해 키워드가 포함되면 제외
        boolean isWeatherRisk = WEATHER_KEYWORDS.stream()
                .anyMatch(kw -> normalized.contains(kw));
        if (isWeatherRisk) return false;
        // 병해충 키워드가 포함되면 선택
        return PEST_KEYWORDS.stream().anyMatch(kw -> normalized.contains(kw));
    }

    private List<Map<String, Object>> loadActiveCultivations() {
        String sql = """
                SELECT cr.id, c.name AS crop_name, f.user_id
                FROM cultivation_registrations cr
                JOIN crops c ON cr.crop_id = c.id
                JOIN farms f ON cr.farm_id = f.id
                WHERE cr.status = 'ACTIVE'
                  AND cr.deleted_at IS NULL
                  AND f.deleted_at IS NULL
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
}
