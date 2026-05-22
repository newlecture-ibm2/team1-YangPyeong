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
        List<PolicyData> results = policyQueryPort.findByCondition(condition);
        // 행정 공고(비혜택 문서) 필터링 — DB 데이터는 유지하되 사용자 목록에서 제외
        List<PolicyData> filtered = results.stream()
                .filter(p -> !PolicyNoticeFilter.isNonBenefitNotice(p.getTitle()))
                .toList();
        if (results.size() != filtered.size()) {
            log.debug("정책 목록 필터링: 전체={}, 행정공고 제외={}, 노출={}",
                    results.size(), results.size() - filtered.size(), filtered.size());
        }
        return filtered;
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
