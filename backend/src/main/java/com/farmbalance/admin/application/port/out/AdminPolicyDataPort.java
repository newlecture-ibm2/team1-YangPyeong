package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminPolicyData;

import java.util.List;
import java.util.Optional;

/**
 * ADM-012 정책 데이터 관리용 Output Port
 */
public interface AdminPolicyDataPort {

    List<AdminPolicyData> findAll();

    Optional<AdminPolicyData> findById(Long id);

    Long save(AdminPolicyData policyData);

    void update(AdminPolicyData policyData);
}
