package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.ApiSyncStatus;

import java.util.List;

/**
 * API 동기화 상태 관리 UseCase (Input Port)
 * ADM-004: 외부 API 데이터 상태 조회, On/Off 제어, 수동 동기화 트리거
 */
public interface ManageApiSyncUseCase {

    /** 전체 API 동기화 상태 목록 조회 */
    List<ApiSyncStatus> getAllApiSyncStatuses();

    /** 단건 조회 */
    ApiSyncStatus getApiSyncStatusById(Long id);

    /** API 이름으로 조회 */
    ApiSyncStatus getApiSyncStatusByName(String apiName);

    /** 활성/비활성 토글 */
    void toggleActive(Long id, boolean isActive);

    /** 수동 동기화 트리거 */
    void triggerSync(Long id, String syncMode);
}
