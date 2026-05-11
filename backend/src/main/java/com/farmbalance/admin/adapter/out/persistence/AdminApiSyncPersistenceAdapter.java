package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.adapter.out.persistence.entity.ApiSyncStatusJpaEntity;
import com.farmbalance.admin.adapter.out.persistence.repository.ApiSyncStatusJpaRepository;
import com.farmbalance.admin.application.port.out.AdminApiSyncPort;
import com.farmbalance.admin.domain.ApiSyncStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * API 동기화 상태 Persistence Adapter (Admin 전용 테이블 — JPA 사용)
 */
@Component
@RequiredArgsConstructor
public class AdminApiSyncPersistenceAdapter implements AdminApiSyncPort {

    private final ApiSyncStatusJpaRepository apiSyncStatusJpaRepository;

    @Override
    public List<ApiSyncStatus> findAll() {
        return apiSyncStatusJpaRepository.findAll().stream()
                .map(ApiSyncStatusJpaEntity::toDomain)
                .toList();
    }

    @Override
    public List<ApiSyncStatus> findByActiveStatus(boolean isActive) {
        return apiSyncStatusJpaRepository.findByIsActive(isActive).stream()
                .map(ApiSyncStatusJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<ApiSyncStatus> findById(Long id) {
        return apiSyncStatusJpaRepository.findById(id)
                .map(ApiSyncStatusJpaEntity::toDomain);
    }

    @Override
    public Optional<ApiSyncStatus> findByApiName(String apiName) {
        return apiSyncStatusJpaRepository.findByApiName(apiName)
                .map(ApiSyncStatusJpaEntity::toDomain);
    }

    @Override
    public Long save(ApiSyncStatus apiSyncStatus) {
        ApiSyncStatusJpaEntity entity = ApiSyncStatusJpaEntity.fromDomain(apiSyncStatus);
        return apiSyncStatusJpaRepository.save(entity).getId();
    }

    @Override
    public void update(ApiSyncStatus apiSyncStatus) {
        apiSyncStatusJpaRepository.findByApiName(apiSyncStatus.getApiName()).ifPresent(entity -> {
            entity.updateAll(
                    apiSyncStatus.getLastSynced(),
                    apiSyncStatus.getLastHealthChecked(),
                    apiSyncStatus.getSyncStatus(),
                    apiSyncStatus.getLastRecordCount(),
                    apiSyncStatus.getErrorMessage()
            );
        });
    }

    @Override
    public void updateActiveStatus(Long id, boolean isActive) {
        apiSyncStatusJpaRepository.findById(id).ifPresent(entity -> {
            entity.updateActiveStatus(isActive);
        });
    }
}
