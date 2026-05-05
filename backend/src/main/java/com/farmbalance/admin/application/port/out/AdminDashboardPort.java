package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminDashboard;

/**
 * ADM-011 관리자 대시보드 통계 집계용 Output Port
 */
public interface AdminDashboardPort {

    /**
     * 대시보드 KPI 데이터를 집계하여 반환
     */
    AdminDashboard aggregateDashboard();
}
