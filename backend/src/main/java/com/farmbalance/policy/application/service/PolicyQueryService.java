package com.farmbalance.policy.application.service;

import com.farmbalance.policy.application.port.in.SearchPolicyUseCase;
import com.farmbalance.policy.application.port.out.PolicyQueryPort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 정책 조회 서비스.
 * Domain 객체만 사용하며, DTO/JPA Entity에 직접 의존하지 않습니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyQueryService implements SearchPolicyUseCase {

    private final PolicyQueryPort policyQueryPort;

    @Override
    public List<PolicyData> searchPolicies(PolicySearchCondition condition) {
        return policyQueryPort.findByCondition(condition);
    }

    @Override
    public long countPolicies(PolicySearchCondition condition) {
        return policyQueryPort.countByCondition(condition);
    }
}
