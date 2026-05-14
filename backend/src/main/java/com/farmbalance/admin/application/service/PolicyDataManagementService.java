package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.dto.AdminPolicyDataDto;
import com.farmbalance.admin.application.port.in.ManagePolicyDataUseCase;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.policy.application.port.out.PolicyQueryPort;
import com.farmbalance.policy.application.port.out.PolicySavePort;
import com.farmbalance.policy.domain.model.PolicyData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ADM-012 정책 데이터 관리 UseCase 구현체
 * 헥사고날 아키텍처: policy 도메인의 Output Port를 통해 데이터에 접근합니다.
 * Domain 객체 생성/변환은 Service에서 담당합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyDataManagementService implements ManagePolicyDataUseCase {

    private final PolicyQueryPort policyQueryPort;
    private final PolicySavePort policySavePort;

    @Override
    public List<AdminPolicyDataDto> getAllPolicies() {
        return policyQueryPort.findAll().stream()
                .map(AdminPolicyDataDto::from)
                .toList();
    }

    @Override
    public AdminPolicyDataDto getPolicy(Long id) {
        PolicyData domain = policyQueryPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POLICY_NOT_FOUND));
        return AdminPolicyDataDto.from(domain);
    }

    @Override
    @Transactional
    public Long createPolicy(String externalId, String title, String category, String organization, String regionCode, String contentSummary, String sourceUrl) {
        PolicyData policyData = new PolicyData();
        policyData.setExternalId(externalId);
        policyData.setTitle(title);
        policyData.setCategory(category);
        policyData.setOrganization(organization);
        policyData.setRegionCode(regionCode);
        policyData.setContent(contentSummary);
        policyData.setSourceUrl(sourceUrl);
        policyData.setFetchedAt(LocalDateTime.now());

        PolicyData saved = policySavePort.save(policyData);
        return saved.getId();
    }

    @Override
    @Transactional
    public void updatePolicy(Long id, String externalId, String title, String category, String organization, String regionCode, String contentSummary, String sourceUrl) {
        PolicyData existing = policyQueryPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POLICY_NOT_FOUND));

        existing.setExternalId(externalId);
        existing.setTitle(title);
        existing.setCategory(category);
        existing.setOrganization(organization);
        existing.setRegionCode(regionCode);
        existing.setContent(contentSummary);
        existing.setSourceUrl(sourceUrl);
        existing.setFetchedAt(LocalDateTime.now());

        policySavePort.save(existing);
    }

    @Override
    @Transactional
    public void deletePolicy(Long id) {
        PolicyData existing = policyQueryPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POLICY_NOT_FOUND));

        existing.setDeletedAt(LocalDateTime.now());
        policySavePort.save(existing);
    }
}
