package com.farmbalance.policy.application.port.in;

import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;

import java.util.List;

/**
 * 정책 목록 조회 Input Port.
 */
public interface SearchPolicyUseCase {

    /**
     * 조건에 맞는 정책 목록을 페이징 조회합니다.
     *
     * @param condition 검색 조건
     * @return 정책 도메인 객체 목록
     */
    List<PolicyData> searchPolicies(PolicySearchCondition condition);

    /**
     * 조건에 맞는 정책의 총 개수를 반환합니다.
     *
     * @param condition 검색 조건
     * @return 총 건수
     */
    long countPolicies(PolicySearchCondition condition);
}
