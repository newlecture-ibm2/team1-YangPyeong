package com.farmbalance.balance.adapter.in.event;

import com.farmbalance.farm.domain.event.CultivationChangedEvent;
import com.farmbalance.farm.domain.event.HarvestRecordedEvent;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import com.farmbalance.balance.domain.SupplyRatioResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class BalanceEventListener {

    private final com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase calculateSupplyRatioUseCase;
    private final NotificationUseCase notificationUseCase;
    private final org.springframework.cache.CacheManager cacheManager;
    private final JdbcTemplate jdbcTemplate;

    // 같은 작물에 대해 5분 이내 중복 알림 발송을 방지하기 위한 쿨다운 맵
    private static final long NOTIFICATION_COOLDOWN_SECONDS = 300; // 5분
    private final Map<String, Instant> lastNotificationTimeMap = new ConcurrentHashMap<>();

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCultivationChanged(CultivationChangedEvent event) {
        log.info("[Event-Balance] 수급 밸런스 업데이트 및 캐시 무효화 시작 - 작물: {}, 유형: {}", event.cropName(), event.changeType());

        try {
            // 1. 현재 작물에 대한 수급 비율 재계산 및 캐시 무효화
            SupplyRatioResult result = calculateSupplyRatioUseCase.recalculate(event.cropName());
            evictSupplyTrendCache(event.cropName());

            // 1-1. 파종 밀도에 따른 쏠림/부족 알림 (명세서 5번 반영)
            handleBalanceNotification(event.cropName(), result.getRatio());

            // 2. 만약 작물명이 바뀌었다면 이전 작물도 재계산 및 캐시 무효화
            if (event.oldCropName() != null && !event.oldCropName().equals(event.cropName())) {
                log.info("[Event-Balance] 작물명 변경 감지: {} -> {}. 기존 작물 캐시도 무효화합니다.", event.oldCropName(), event.cropName());
                calculateSupplyRatioUseCase.recalculate(event.oldCropName());
                evictSupplyTrendCache(event.oldCropName());
            }

            log.info("[Event-Balance] 수급 밸런스 업데이트 및 캐시 무효화 완료 - 작물: {}", event.cropName());
        } catch (Exception e) {
            log.error("[Event-Balance-Error] 수급 밸런스 업데이트 실패 - 작물: {}, 원인: {}", event.cropName(), e.getMessage(), e);
        }
    }

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleHarvestRecorded(HarvestRecordedEvent event) {
        log.info("[Event-Balance] 수확 완료 감지 - 캐시 무효화 시작: {}", event.getCropName());
        try {
            calculateSupplyRatioUseCase.recalculate(event.getCropName());
            evictSupplyTrendCache(event.getCropName());
            log.info("[Event-Balance] 수확 완료에 따른 수급 밸런스 갱신 완료: {}", event.getCropName());
        } catch (Exception e) {
            log.error("[Event-Balance-Error] 수확 완료 처리 실패: {}, 원인: {}", event.getCropName(), e.getMessage(), e);
        }
    }

    private void evictSupplyTrendCache(String cropName) {
        org.springframework.cache.Cache cache = cacheManager.getCache("supplyTrends");
        if (cache != null) {
            cache.evict(cropName);
            log.info("[Cache-Evict] 'supplyTrends' 캐시 삭제 완료 - 키: {}", cropName);
        }
    }

    private void handleBalanceNotification(String cropName, double ratio) {
        if (ratio <= 0) return; // 데이터가 부족하여 0인 경우 패스

        // 쿨다운 체크: 같은 작물에 대해 5분 이내 중복 알림 방지
        Instant lastSent = lastNotificationTimeMap.get(cropName);
        if (lastSent != null && Instant.now().isBefore(lastSent.plusSeconds(NOTIFICATION_COOLDOWN_SECONDS))) {
            log.info("[Event-Balance] 수급 알림 쿨다운 중 - 작물: {}, 마지막 발송: {}", cropName, lastSent);
            return;
        }

        String message = null;
        List<Long> targetUserIds = new ArrayList<>();

        if (ratio > 150.0) {
            message = String.format("[%s] 공급률이 %.1f%%로 과잉경고 상태입니다. 대안 작물을 확인하세요.", cropName, ratio);
            targetUserIds.addAll(getFarmersGrowingCrop(cropName));
            targetUserIds.addAll(getGovUsers());
        } else if (ratio >= 120.0) {
            message = String.format("[%s] 공급률이 %.1f%%로 과잉주의 상태입니다.", cropName, ratio);
            targetUserIds.addAll(getFarmersGrowingCrop(cropName));
            targetUserIds.addAll(getGovUsers());
        } else if (ratio < 50.0) {
            message = String.format("[%s] 공급률이 %.1f%%로 부족경고입니다. 적극 재배를 권장합니다.", cropName, ratio);
            targetUserIds.addAll(getAllFarmers());
            targetUserIds.addAll(getGovUsers());
        } else if (ratio <= 80.0) {
            message = String.format("[%s] 공급률이 %.1f%%로 부족주의입니다. 재배를 권장합니다.", cropName, ratio);
            targetUserIds.addAll(getAllFarmers());
            targetUserIds.addAll(getGovUsers());
        }

        if (message != null && !targetUserIds.isEmpty()) {
            List<Long> uniqueIds = targetUserIds.stream().distinct().collect(Collectors.toList());
            notificationUseCase.createBulkNotifications(
                    uniqueIds,
                    NotificationType.BALANCE_WARN,
                    NotificationCategory.BALANCE_WARN,
                    "수급 임계값 안내",
                    message,
                    "/balance"
            );
            lastNotificationTimeMap.put(cropName, Instant.now());
            log.info("[Event-Balance] 수급 알림 발송 완료 - 작물: {}, 발송 대상 수: {}", cropName, uniqueIds.size());
        }
    }

    private List<Long> getGovUsers() {
        try {
            return jdbcTemplate.queryForList("SELECT id FROM users WHERE role = 'GOV'", Long.class);
        } catch (Exception e) {
            log.error("지자체 유저 조회 실패", e);
            return new ArrayList<>();
        }
    }

    private List<Long> getAllFarmers() {
        try {
            return jdbcTemplate.queryForList("SELECT DISTINCT user_id FROM farms", Long.class);
        } catch (Exception e) {
            log.error("전체 농부 조회 실패", e);
            return new ArrayList<>();
        }
    }

    private List<Long> getFarmersGrowingCrop(String cropName) {
        try {
            String sql = "SELECT DISTINCT f.user_id FROM farms f " +
                         "JOIN cultivation_registrations c ON f.id = c.farm_id " +
                         "JOIN crops cr ON c.crop_id = cr.id " +
                         "WHERE cr.name = ?";
            return jdbcTemplate.queryForList(sql, Long.class, cropName);
        } catch (Exception e) {
            log.error("[{}] 재배 농부 조회 실패", cropName, e);
            return new ArrayList<>();
        }
    }
}
