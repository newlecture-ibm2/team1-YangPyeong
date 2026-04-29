package com.farmbalance.gov.application.result;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class GovDashboardResult {
    private final DashboardSummary summary;
    private final List<WarningItem> warningItems;
    private final List<MonthlySupply> monthlySupply;
    private final List<RegionDistribution> regionDistribution;

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
}
