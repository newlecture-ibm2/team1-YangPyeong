package com.farmbalance.policy.adapter.in.scheduler;

import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.farmbalance.policy.adapter.out.persistence.entity.BatchLogJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.BatchLogRepository;

/**
 * 정책 동기화 스케줄러.
 *
 * 매일 새벽 3시에 정책 데이터를 자동 동기화합니다.
 * 기본 비활성 — app.policy.scheduler-enabled=true 설정 시 활성화.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.policy.scheduler-enabled", havingValue = "true", matchIfMissing = false)
public class PolicySyncScheduler {

    private final SyncPolicyUseCase syncPolicyUseCase;
    private final BatchLogRepository batchLogRepository;

    /**
     * 매일 새벽 3시 정책 동기화.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void syncDaily() {
        log.info("[PolicyScheduler] 일일 정책 동기화 시작");
        BatchLogJpaEntity logEntity = new BatchLogJpaEntity();
        logEntity.setJobName("POLICY_SYNC");
        try {
            SyncPolicyUseCase.SyncResult result = syncPolicyUseCase.syncPolicies();
            log.info("[PolicyScheduler] 동기화 완료 — fetched={}, analyzed={}, skipped={}, created={}, updated={}, failed={}",
                    result.fetched(), result.analyzed(), result.skipped(),
                    result.created(), result.updated(), result.failed());

            logEntity.setStatus(result.failed() > 0 ? "COMPLETED_WITH_WARNINGS" : "SUCCESS");
            logEntity.setTotalProcessed(result.fetched());
            logEntity.setTotalFailed(result.failed());
            
            StringBuilder msg = new StringBuilder();
            msg.append(String.format("fetched=%d, analyzed=%d, skipped=%d, created=%d, updated=%d, failed=%d\n",
                    result.fetched(), result.analyzed(), result.skipped(),
                    result.created(), result.updated(), result.failed()));

            if (!result.warnings().isEmpty()) {
                msg.append("Warnings: ").append(result.warnings().size()).append("건\n");
                msg.append(String.join("\n", result.warnings().subList(0, Math.min(10, result.warnings().size()))));
            }
            logEntity.setMessages(msg.toString());
        } catch (Exception e) {
            log.error("[PolicyScheduler] 동기화 실패: {}", e.getMessage(), e);
            logEntity.setStatus("FAILED");
            logEntity.setMessages(e.getMessage());
        } finally {
            batchLogRepository.save(logEntity);
        }
    }
}
