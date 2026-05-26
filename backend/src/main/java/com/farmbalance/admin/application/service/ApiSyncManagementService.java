package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.application.port.out.AdminApiSyncPort;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.SyncTriggerEvent;
import com.farmbalance.global.event.HealthCheckTriggerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ADM-004 API 동기화 상태 관리 Service
 * 외부 API 상태 목록 조회, On/Off 토글, 수동 동기화 트리거 기능을 제공합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiSyncManagementService implements ManageApiSyncUseCase {

    private final AdminApiSyncPort adminApiSyncPort;
    private final ApplicationEventPublisher eventPublisher;
    private final NongsaroCropSyncService nongsaroCropSyncService;

    @Override
    public List<ApiSyncStatus> getAllApiSyncStatuses() {
        return adminApiSyncPort.findAll();
    }

    @Override
    public ApiSyncStatus getApiSyncStatusById(Long id) {
        return adminApiSyncPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.API_SYNC_NOT_FOUND));
    }

    @Override
    public ApiSyncStatus getApiSyncStatusByName(String apiName) {
        return adminApiSyncPort.findByApiName(apiName)
                .orElseThrow(() -> new BusinessException(ErrorCode.API_SYNC_NOT_FOUND));
    }

    @Override
    @Transactional
    public void toggleActive(Long id, boolean isActive) {
        adminApiSyncPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.API_SYNC_NOT_FOUND));

        adminApiSyncPort.updateActiveStatus(id, isActive);
    }

    @Override
    @Transactional
    public void triggerSync(Long id, String syncMode) {
        ApiSyncStatus status = adminApiSyncPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.API_SYNC_NOT_FOUND));

        if (!status.getIsActive()) {
            throw new BusinessException(ErrorCode.API_SYNC_NOT_FOUND);
        }

        if ("KAKAO_LOCAL".equals(status.getApiName()) || "SOIL_ENVIRONMENT".equals(status.getApiName())) {
            log.warn("[ApiSync] {}는 실시간/단순 점검 전용 API이므로 수동 수집을 지원하지 않습니다.", status.getApiName());
            throw new BusinessException(ErrorCode.UNSUPPORTED_OPERATION);
        }

        ApiSyncStatus running = ApiSyncStatus.builder()
                .id(status.getId())
                .apiName(status.getApiName())
                .displayName(status.getDisplayName())
                .lastSynced(status.getLastSynced())
                .lastHealthChecked(status.getLastHealthChecked())
                .syncStatus("RUNNING")
                .lastRecordCount(status.getLastRecordCount())
                .errorMessage(null)
                .isActive(status.getIsActive())
                .createdAt(status.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .deletedAt(status.getDeletedAt())
                .build();
        adminApiSyncPort.update(running);

        log.info("[ApiSync] 수동 동기화 트리거: api={}, mode={}", status.getApiName(), syncMode);

        if ("NONGSARO_CROP".equals(status.getApiName())) {
            try {
                nongsaroCropSyncService.syncCrops(syncMode);
                // 성공 이벤트 발행
                eventPublisher.publishEvent(new ApiSyncEvent(
                        status.getApiName(), "SUCCESS", 0, null));
            } catch (Exception e) {
                log.error("[ApiSync] 동기화 실패: api={}", status.getApiName(), e);
                // 실패 이벤트 발행
                eventPublisher.publishEvent(new ApiSyncEvent(
                        status.getApiName(), "FAILED", 0, e.getMessage()));
                throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
            }
        } else {
            // 다른 도메인으로 수동 동기화 지시 이벤트 발행
            eventPublisher.publishEvent(new SyncTriggerEvent(status.getApiName(), syncMode));
        }
    }

    @Override
    @Transactional
    public void triggerHealthCheck(Long id) {
        ApiSyncStatus status = adminApiSyncPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.API_SYNC_NOT_FOUND));

        if (!status.getIsActive()) {
            throw new BusinessException(ErrorCode.API_SYNC_NOT_FOUND);
        }

        // 상태를 RUNNING으로 변경
        ApiSyncStatus running = ApiSyncStatus.builder()
                .id(status.getId())
                .apiName(status.getApiName())
                .displayName(status.getDisplayName())
                .lastSynced(status.getLastSynced())
                .lastHealthChecked(status.getLastHealthChecked())
                .syncStatus("RUNNING")
                .lastRecordCount(status.getLastRecordCount())
                .errorMessage(null)
                .isActive(status.getIsActive())
                .createdAt(status.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .deletedAt(status.getDeletedAt())
                .build();
        adminApiSyncPort.update(running);

        log.info("[ApiSync] 수동 헬스체크 트리거: api={}", status.getApiName());

        if ("NONGSARO_CROP".equals(status.getApiName())) {
            try {
                // 농사로는 health check를 위해 카테고리 하나만 조회
                nongsaroCropSyncService.healthCheck();
                eventPublisher.publishEvent(new ApiSyncEvent(
                        status.getApiName(), "SUCCESS", 0, null, true));
            } catch (Exception e) {
                log.error("[ApiSync] 헬스체크 실패: api={}", status.getApiName(), e);
                eventPublisher.publishEvent(new ApiSyncEvent(
                        status.getApiName(), "FAILED", 0, e.getMessage(), true));
            }
        } else {
            // 헬스체크 지시 이벤트 발행
            eventPublisher.publishEvent(new HealthCheckTriggerEvent(status.getApiName()));
        }
    }
}
