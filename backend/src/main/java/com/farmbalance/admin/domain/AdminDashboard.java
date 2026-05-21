package com.farmbalance.admin.domain;

import lombok.*;

import java.util.List;
import java.util.Map;

/**
 * 관리자 대시보드 KPI 데이터 (순수 Java — Framework 의존성 없음)
 * ADM-011 관리자 대시보드: 전체 통계
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboard {

    // 섹션 1: 최상단 요약 위젯
    private long pendingFarmApprovals;
    private long pendingReports;
    private long activeUsers;
    private long weeklyNewOrders;

    // 섹션 2: 수급 및 작물 비즈니스 지표
    private List<CropAreaStat> topCropsByArea;
    private List<SeedSalesStat> topSeedsBySales;
    private Map<String, Integer> balanceStatusDistribution;
    private List<CropBalanceStat> excessRiskCrops;
    private List<CropBalanceStat> shortageRiskCrops;

    @Getter
    @Builder
    @AllArgsConstructor
@NoArgsConstructor
    public static class CropAreaStat {
        private String cropName;
        private double totalArea;
    }

    @Getter
    @Builder
    @AllArgsConstructor
@NoArgsConstructor
    public static class SeedSalesStat {
        private String seedName;
        private long salesCount;
    }

    @Getter
    @Builder
    @AllArgsConstructor
@NoArgsConstructor
    public static class CropBalanceStat {
        private String cropName;
        private double ratio;
        private String status;
    }
}
