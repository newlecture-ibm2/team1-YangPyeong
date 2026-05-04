package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.AdminPolicyData;

import java.util.List;

/**
 * ADM-012 정책 데이터 관리 Input Port
 * 지자체 농업 지원 정책 DB 조회/등록/수정
 */
public interface ManagePolicyDataUseCase {

    /**
     * 전체 정책 데이터 목록 조회
     */
    List<AdminPolicyData> getAllPolicies();

    /**
     * 정책 데이터 상세 조회
     */
    AdminPolicyData getPolicy(Long id);

    /**
     * 정책 데이터 등록
     * @return 생성된 정책 ID
     */
    Long createPolicy(AdminPolicyData policyData);

    /**
     * 정책 데이터 수정
     */
    void updatePolicy(AdminPolicyData policyData);
}
