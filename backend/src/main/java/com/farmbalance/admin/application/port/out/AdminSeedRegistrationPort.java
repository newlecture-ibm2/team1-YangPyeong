package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminSeedRegistration;

import java.util.List;

/**
 * ADM-002 종자 등록 조회 / ADM-011 대시보드 통계용 Output Port
 */
public interface AdminSeedRegistrationPort {

    List<AdminSeedRegistration> findByFarmId(Long farmId);

    List<AdminSeedRegistration> findAll();
}
