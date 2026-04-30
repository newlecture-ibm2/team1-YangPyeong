package com.farmbalance.policy.application.port.out;

import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;

import java.util.List;
import java.util.Optional;

/**
 * 정책 조회 Output Port.
 * Persistence Adapter가 구현합니다.
 */
public interface PolicyQueryPort {

    /**
     * 검색 조건에 맞는 정책 목록을 페이징 조회합니다.
     */
    List<PolicyData> findByCondition(PolicySearchCondition condition);

    /**
     * 검색 조건에 맞는 정책의 총 개수를 반환합니다.
     */
    long countByCondition(PolicySearchCondition condition);

    /**
     * ID로 정책 단건을 조회합니다.
     */
    Optional<PolicyData> findById(Long id);
}
