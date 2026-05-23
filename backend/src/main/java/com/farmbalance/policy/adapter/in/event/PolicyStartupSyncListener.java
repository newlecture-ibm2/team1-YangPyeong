package com.farmbalance.policy.adapter.in.event;

import com.farmbalance.policy.adapter.out.persistence.repository.PolicyDataRepository;
import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 애플리케이션 시작 시 정책 DB가 비어있으면 자동으로 1회 동기화를 수행합니다.
 *
 * <p>배포 직후 / DB 초기화 후에도 사용자가 빈 정책 목록을 보지 않도록 보장합니다.
 * 이미 데이터가 있으면 동기화를 건너뜁니다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PolicyStartupSyncListener {

    private final PolicyDataRepository policyDataRepository;
    private final SyncPolicyUseCase syncPolicyUseCase;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        long count = policyDataRepository.count();
        if (count > 0) {
            log.info("[PolicyStartupSync] 정책 데이터 {}건 존재 — 시작 시 동기화 생략", count);
            return;
        }

        log.info("[PolicyStartupSync] 정책 데이터가 비어 있습니다. 초기 동기화를 시작합니다…");
        try {
            SyncPolicyUseCase.SyncResult result = syncPolicyUseCase.syncPolicies();
            log.info("[PolicyStartupSync] 초기 동기화 완료: fetched={}, created={}, failed={}",
                    result.fetched(), result.created(), result.failed());
        } catch (Exception e) {
            log.error("[PolicyStartupSync] 초기 동기화 실패 (스케줄러가 재시도합니다): {}", e.getMessage());
        }
    }
}
