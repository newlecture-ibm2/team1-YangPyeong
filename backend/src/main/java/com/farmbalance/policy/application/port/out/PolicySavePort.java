package com.farmbalance.policy.application.port.out;

import com.farmbalance.policy.domain.model.PolicyData;

import java.util.List;
import java.util.Optional;

/**
 * 정책 저장 Output Port.
 * Persistence Adapter가 구현합니다.
 */
public interface PolicySavePort {

    /**
     * 정책 데이터를 저장합니다 (신규 또는 갱신).
     */
    PolicyData save(PolicyData policyData);

    /**
     * external_id + source 기준으로 기존 정책 데이터를 조회합니다.
     * upsert 판별에 사용합니다.
     */
    Optional<PolicyData> findByExternalIdAndSource(String externalId, String source);

    /**
     * 삭제되지 않은 전체 정책 데이터를 조회합니다.
     * 재정규화(reprocess) 시 사용합니다.
     */
    List<PolicyData> findAll();
}
