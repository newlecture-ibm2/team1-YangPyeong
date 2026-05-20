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
 * 재배 일정 기반 영농 가이드 알림 스케줄러.
 * 매일 09:00에 실행되며 ACTIVE 상태 재배 등록과 농사로 일정을 비교하여
 * 이달의 주요 농작업 및 수확 적기 알림을 발송합니다.
 * 같은 달에 동일 제목의 알림이 이미 발송된 경우 중복 발송하지 않습니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CultivationScheduleGuideScheduler {

    private final NotificationUseCase notificationUseCase;
    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 9 * * *")
    public void checkCultivationSchedules() {
        int currentMonth = LocalDate.now().getMonthValue();
        log.info("[CultivationScheduleGuide] 재배 일정 알림 체크 시작 - {}월", currentMonth);

        List<Map<String, Object>> activeCultivations = loadActiveCultivations();
        log.info("[CultivationScheduleGuide] ACTIVE 재배 등록 수: {}건", activeCultivations.size());

        // 사용자별로 그룹화하여 작물 목록 집계
        Map<Long, List<Map<String, Object>>> byUser = activeCultivations.stream()
                .collect(Collectors.groupingBy(row -> (Long) row.get("user_id")));

        for (Map.Entry<Long, List<Map<String, Object>>> entry : byUser.entrySet()) {
            Long userId = entry.getKey();
            List<Map<String, Object>> userCultivations = entry.getValue();

            for (Map<String, Object> cultivation : userCultivations) {
                String cropName = (String) cultivation.get("crop_name");
                processScheduleAlerts(userId, cropName, currentMonth);
            }
        }

        log.info("[CultivationScheduleGuide] 재배 일정 알림 체크 완료");
    }

    private void processScheduleAlerts(Long userId, String cropName, int currentMonth) {
        // 이달 해당 작물의 주요 농작업 조회 (생육과정 타입만)
        List<String> operations = loadCurrentMonthOperations(cropName, currentMonth);
        if (operations.isEmpty()) {
            return;
        }

        // 수확 작업과 일반 작업 분리
        List<String> harvestOps = operations.stream()
                .filter(op -> op.contains("수확"))
                .collect(Collectors.toList());
        List<String> generalOps = operations.stream()
                .filter(op -> !op.contains("수확"))
                .collect(Collectors.toList());

        // 수확 적기 알림
        if (!harvestOps.isEmpty()) {
            String title = String.format("[%s] 수확 적기 안내", cropName);
            if (!alreadySentThisMonth(userId, title)) {
                notificationUseCase.createNotification(
                        userId,
                        NotificationType.GUIDE,
                        NotificationCategory.GUIDE_SCHEDULE,
                        title,
                        String.format("%s 수확 시기가 도래했습니다. 적기 수확으로 품질과 수익을 높이세요.", cropName),
                        "/farm/harvest"
                );
                log.info("[CultivationScheduleGuide] 수확 알림 발송 - userId={}, 작물={}", userId, cropName);
            }
        }

        // 이달의 주요 농작업 알림
        if (!generalOps.isEmpty()) {
            String title = String.format("[%s] 이달의 주요 농작업", cropName);
            if (!alreadySentThisMonth(userId, title)) {
                String opSummary = generalOps.stream()
                        .limit(3) // 최대 3개 표시
                        .map(op -> op.replaceAll("<br ?/?>", " ").trim())
                        .collect(Collectors.joining(", "));
                notificationUseCase.createNotification(
                        userId,
                        NotificationType.GUIDE,
                        NotificationCategory.GUIDE_SCHEDULE,
                        title,
                        String.format("이달 %s 주요 작업: %s. 농사로 가이드를 확인하세요.", cropName, opSummary),
                        "/farm"
                );
                log.info("[CultivationScheduleGuide] 농작업 알림 발송 - userId={}, 작물={}, 작업={}",
                        userId, cropName, opSummary);
            }
        }
    }

    private List<Map<String, Object>> loadActiveCultivations() {
        String sql = """
                SELECT cr.id, cr.sowing_date, c.name AS crop_name, f.user_id
                FROM cultivation_registrations cr
                JOIN crops c ON cr.crop_id = c.id
                JOIN farms f ON cr.farm_id = f.id
                WHERE cr.status = 'ACTIVE'
                  AND cr.deleted_at IS NULL
                  AND cr.sowing_date IS NOT NULL
                  AND f.deleted_at IS NULL
                """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<String> loadCurrentMonthOperations(String cropName, int month) {
        String sql = """
                SELECT DISTINCT operation_name
                FROM nongsaro_farm_schedules
                WHERE farm_work_type = ?
                  AND info_type_code = '410001'
                  AND CAST(start_month AS INT) <= ?
                  AND CAST(end_month AS INT) >= ?
                  AND deleted_at IS NULL
                """;
        return jdbcTemplate.queryForList(sql, String.class, cropName, month, month);
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
