package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.AdminDashboard;

/**
 * ADM-011 관리자 대시보드 Input Port
 */
public interface GetDashboardUseCase {

    /**
     * 관리자 대시보드 KPI 조회
     */
    AdminDashboard getDashboard();
}
