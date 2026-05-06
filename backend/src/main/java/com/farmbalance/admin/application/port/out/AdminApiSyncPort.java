package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.ApiSyncStatus;

import java.util.List;
import java.util.Optional;

/**
 * API 동기화 상태 관리용 Output Port (Admin 전용 테이블)
 */
public interface AdminApiSyncPort {

    List<ApiSyncStatus> findAll();

    List<ApiSyncStatus> findByActiveStatus(boolean isActive);

    Optional<ApiSyncStatus> findById(Long id);

    Optional<ApiSyncStatus> findByApiName(String apiName);

    Long save(ApiSyncStatus apiSyncStatus);

    void update(ApiSyncStatus apiSyncStatus);

    void updateActiveStatus(Long id, boolean isActive);
}
