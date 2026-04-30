package com.farmbalance.policy.application.port.in;

import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;

import java.util.List;
import java.util.Optional;

/**
 * 정책 조회 Input Port.
 */
public interface SearchPolicyUseCase {

    /**
     * 조건에 맞는 정책 목록을 페이징 조회합니다.
     */
    List<PolicyData> searchPolicies(PolicySearchCondition condition);

    /**
     * 조건에 맞는 정책의 총 개수를 반환합니다.
     */
    long countPolicies(PolicySearchCondition condition);

    /**
     * ID로 정책 상세를 조회합니다.
     */
    Optional<PolicyData> findById(Long id);
}
