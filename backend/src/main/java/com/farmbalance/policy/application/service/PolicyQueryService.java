package com.farmbalance.policy.application.service;

import com.farmbalance.policy.application.port.in.SearchPolicyUseCase;
import com.farmbalance.policy.application.port.out.PolicyQueryPort;
import com.farmbalance.policy.domain.PolicyNoticeFilter;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 정책 조회 서비스.
 * Domain 객체만 사용하며, DTO/JPA Entity에 직접 의존하지 않습니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyQueryService implements SearchPolicyUseCase {

    private final PolicyQueryPort policyQueryPort;

    @Override
    public List<PolicyData> searchPolicies(PolicySearchCondition condition) {
        // 행정 공고 필터는 DB 쿼리(searchPolicies JPQL)에서 처리되므로 추가 필터 불필요
        return policyQueryPort.findByCondition(condition);
    }

    @Override
    public long countPolicies(PolicySearchCondition condition) {
        return policyQueryPort.countByCondition(condition);
    }

    @Override
    public Optional<PolicyData> findById(Long id) {
        return policyQueryPort.findById(id);
    }
}
