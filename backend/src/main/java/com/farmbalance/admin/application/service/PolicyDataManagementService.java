package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManagePolicyDataUseCase;
import com.farmbalance.admin.application.port.out.AdminPolicyDataPort;
import com.farmbalance.admin.domain.AdminPolicyData;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ADM-012 정책 데이터 관리 UseCase 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyDataManagementService implements ManagePolicyDataUseCase {

    private final AdminPolicyDataPort adminPolicyDataPort;

    @Override
    public List<AdminPolicyData> getAllPolicies() {
        return adminPolicyDataPort.findAll();
    }

    @Override
    public AdminPolicyData getPolicy(Long id) {
        return adminPolicyDataPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POLICY_NOT_FOUND));
    }

    @Override
    @Transactional
    public Long createPolicy(AdminPolicyData policyData) {
        return adminPolicyDataPort.save(policyData);
    }

    @Override
    @Transactional
    public void updatePolicy(AdminPolicyData policyData) {
        adminPolicyDataPort.findById(policyData.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.POLICY_NOT_FOUND));

        adminPolicyDataPort.update(policyData);
    }
}
