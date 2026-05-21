package com.farmbalance.balance.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class BalanceDashboardResponse {

    private final List<TownInfo> userTowns;
    private final String selectedTownCode;
    private final String selectedTownName;
    private final SupplySummary townSummary;
    private final SupplySummary totalSummary;

    @Getter
    @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
    public static class TownInfo {
        private final String code;
        private final String name;
    }

    @Getter
    @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
    public static class CropSupplyItem {
        private final String cropName;
        private final double currentSupplyKg;
        private final double standardYieldKg;
        private final double supplyRatio;
        private final String status;
        private final String statusLabel;
    }

    @Getter
    @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
    public static class SupplySummary {
        private final String label;
        private final int farmCount;
        private final List<CropSupplyItem> crops;
    }
}
