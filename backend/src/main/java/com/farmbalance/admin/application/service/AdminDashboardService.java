package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.GetDashboardUseCase;
import com.farmbalance.admin.application.port.out.AdminDashboardPort;
import com.farmbalance.admin.domain.AdminDashboard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ADM-011 관리자 대시보드 UseCase 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService implements GetDashboardUseCase {

    private final AdminDashboardPort adminDashboardPort;

    @Override
    public AdminDashboard getDashboard() {
        return adminDashboardPort.aggregateDashboard();
    }
}
