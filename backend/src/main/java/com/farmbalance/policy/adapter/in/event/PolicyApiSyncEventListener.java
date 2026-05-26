package com.farmbalance.policy.adapter.in.event;

import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.SyncTriggerEvent;
import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 관리자 페이지에서 발생한 수동 동기화 이벤트를 수신하여 처리합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PolicyApiSyncEventListener {

    private final SyncPolicyUseCase syncPolicyUseCase;
    private final ApplicationEventPublisher eventPublisher;

    @Async
    @EventListener
    public void onSyncTriggerEvent(SyncTriggerEvent event) {
        if (!"POLICY_DATA".equals(event.apiName())) {
            return;
        }

        log.info("[PolicyApiSync] 수동 동기화 지시 수신. 모드={}", event.syncMode());
        try {
            SyncPolicyUseCase.SyncResult result = syncPolicyUseCase.syncPolicies(event.syncMode());
            log.info("[PolicyApiSync] 동기화 성공: fetched={}", result.fetched());
            
            eventPublisher.publishEvent(new ApiSyncEvent(
                    "POLICY_DATA", "SUCCESS", result.fetched(), null));
        } catch (Exception e) {
            log.error("[PolicyApiSync] 동기화 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent(
                    "POLICY_DATA", "FAILED", 0, e.getMessage()));
        }
    }
}
