package com.farmbalance.admin.domain;

import lombok.*;

/**
 * 관리자 대시보드 KPI 데이터 (순수 Java — Framework 의존성 없음)
 * ADM-011 관리자 대시보드: 전체 통계
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminDashboard {

    private long totalUsers;
    private long totalFarmers;
    private long pendingApprovals;
    private long totalFarms;
    private long totalCrops;
    private long totalPosts;
    private long totalProducts;
    private long totalOrders;
    private long todayRegistrations;
}
