package com.farmbalance.gov.domain.model;

import lombok.Builder;
import lombok.Getter;

/**
 * 지자체 도메인 순수 모델 — Spring 어노테이션 없음
 */
public class GovDomain {

    @Getter @Builder
    public static class DashboardSummary {
        private final int totalFarms;
        private final int totalCrops;
        private final int surplusCount;
        private final int shortageCount;
    }

    @Getter @Builder
    public static class WarningItem {
        private final String cropName;
        private final double supplyRate;
        private final String status;
        private final String level;
        private final String advice;
    }

    @Getter @Builder
    public static class MonthlySupply {
        private final String label;
        private final double supply;
        private final double demand;
    }

    @Getter @Builder
    public static class RegionDistribution {
        private final String region;
        private final int count;
    }

    @Getter @Builder
    public static class CultivationRow {
        private final String region;
        private final int farmCount;
        private final double areaM2;
        private final String mainCrop;
        private final double expectedTon;
    }

    @Getter @Builder
    public static class YearCompareRow {
        private final String crop;
        private final double prevYearTon;
        private final double currentYearTon;
        private final double diffTon;
        private final double diffRate;
    }

    @Getter @Builder
    public static class SalesSummary {
        private final String totalAmount;
        private final int txCount;
        private final int activeSellers;
        private final String momRate;
    }

    @Getter @Builder
    public static class TopProductRow {
        private final int rank;
        private final String productName;
        private final String seller;
        private final int salesVolume;
        private final String revenue;
    }

    @Getter @Builder
    public static class MonthlySales {
        private final String month;
        private final long amount;
    }
}
