package com.farmbalance.admin.adapter.in.event;

import com.farmbalance.admin.application.port.out.AdminApiSyncPort;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.event.ApiSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * API 동기화 이벤트 리스너 (Driving Adapter — Event)
 * 다른 도메인에서 발행한 ApiSyncEvent를 수신하여 api_sync_status 테이블을 갱신합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiSyncEventListener {

    private final AdminApiSyncPort adminApiSyncPort;

    @EventListener
    @Transactional
    public void onApiSyncEvent(ApiSyncEvent event) {
        log.info("[ApiSync] 이벤트 수신: api={}, status={}, count={}",
                event.apiName(), event.status(), event.recordCount());

        adminApiSyncPort.findByApiName(event.apiName()).ifPresent(existing -> {
            ApiSyncStatus updated = ApiSyncStatus.builder()
                    .id(existing.getId())
                    .apiName(existing.getApiName())
                    .displayName(existing.getDisplayName())
                    .lastSynced(LocalDateTime.now())
                    .syncStatus(event.status())
                    .lastRecordCount(event.recordCount())
                    .errorMessage(event.errorMessage())
                    .isActive(existing.getIsActive())
                    .createdAt(existing.getCreatedAt())
                    .updatedAt(LocalDateTime.now())
                    .deletedAt(existing.getDeletedAt())
                    .build();
            adminApiSyncPort.update(updated);
        });
    }
}
