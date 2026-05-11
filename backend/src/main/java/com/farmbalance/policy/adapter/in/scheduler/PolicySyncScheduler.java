package com.farmbalance.policy.adapter.in.scheduler;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 정책 동기화 스케줄러.
 *
 * 매일 새벽 3시에 정책 데이터를 자동 동기화합니다.
 * 기본 비활성, app.policy.scheduler-enabled=true 설정 시 활성화
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.policy.scheduler-enabled", havingValue = "true", matchIfMissing = false)
public class PolicySyncScheduler {

    private final SyncPolicyUseCase syncPolicyUseCase;
    private final ManageApiSyncUseCase manageApiSyncUseCase;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 매일 새벽 3시 정책 동기화
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void syncDaily() {
        try {
            ApiSyncStatus status = manageApiSyncUseCase.getApiSyncStatusByName("POLICY_DATA");
            if (status != null && !status.getIsActive()) {
                log.info("[PolicyScheduler] POLICY_DATA API가 비활성화되어 있어 스케줄러를 종료합니다.");
                return;
            }
        } catch (Exception e) {
            log.warn("[PolicyScheduler] API 상태 조회 실패. (기본 동작 수행)");
        }

        log.info("[PolicyScheduler] 매일 정책 동기화 시작");
        try {
            SyncPolicyUseCase.SyncResult result = syncPolicyUseCase.syncPolicies();
            log.info("[PolicyScheduler] 동기화 종료: fetched={}, analyzed={}, skipped={}, created={}, updated={}, failed={}",
                    result.fetched(), result.analyzed(), result.skipped(),
                    result.created(), result.updated(), result.failed());

            if (!result.warnings().isEmpty()) {
                log.info("[PolicyScheduler] warnings ({}건): {}", result.warnings().size(),
                        result.warnings().subList(0, Math.min(5, result.warnings().size())));
            }

            eventPublisher.publishEvent(new ApiSyncEvent(
                    "POLICY_DATA", "SUCCESS", result.fetched(), null));
        } catch (Exception e) {
            log.error("[PolicyScheduler] 동기화 실패: {}", e.getMessage(), e);
            eventPublisher.publishEvent(new ApiSyncEvent(
                    "POLICY_DATA", "FAILED", 0, e.getMessage()));
        }
    }
}
