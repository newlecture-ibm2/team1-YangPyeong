package com.farmbalance.policy.adapter.in.scheduler;

import com.farmbalance.global.batch.BatchLogService;
import com.farmbalance.global.batch.BatchLogService.BatchResult;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
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
    private final BatchLogService batchLogService;

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

        log.info("[PolicyScheduler] 일일 정책 동기화 시작");
        try {
            batchLogService.executeWithResult("POLICY_SYNC", () -> {
                SyncPolicyUseCase.SyncResult result = syncPolicyUseCase.syncPolicies("MERGE");
                
                String syncStatus = "SUCCESS";
                if (result.failed() > 0) {
                    syncStatus = result.fetched() == 0 ? "FAILED" : "COMPLETED_WITH_WARNINGS";
                }
                
                log.info("[PolicyScheduler] 동기화 종료: fetched={}, analyzed={}, skipped={}, created={}, updated={}, failed={}",
                        result.fetched(), result.analyzed(), result.skipped(),
                        result.created(), result.updated(), result.failed());

                eventPublisher.publishEvent(new ApiSyncEvent(
                        "POLICY_DATA", syncStatus, result.fetched(), result.failed() > 0 ? "일부 정책 동기화 실패" : null));

                // 상세 통계를 batch_logs에 기록
                StringBuilder msg = new StringBuilder();
                msg.append(String.format("fetched=%d, analyzed=%d, skipped=%d, created=%d, updated=%d, failed=%d",
                        result.fetched(), result.analyzed(), result.skipped(),
                        result.created(), result.updated(), result.failed()));

                if (!result.warnings().isEmpty()) {
                    msg.append("\nWarnings: ").append(result.warnings().size()).append("건\n");
                    msg.append(String.join("\n", result.warnings().subList(0, Math.min(10, result.warnings().size()))));
                }

                if (result.failed() > 0) {
                    return BatchResult.withWarnings(result.fetched(), result.failed(), msg.toString());
                }
                return BatchResult.success(result.fetched(), msg.toString());
            });
        } catch (Exception e) {
            log.error("[PolicyScheduler] 정책 일일 동기화 스케줄러 실패", e);
            eventPublisher.publishEvent(new ApiSyncEvent("POLICY_DATA", "FAILED", 0, e.getMessage()));
        }
    }
}
