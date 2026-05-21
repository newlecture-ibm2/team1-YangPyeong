package com.farmbalance.gov.application.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class GovSalesResult {
    private final SalesSummary summary;
    private final List<TopProductRow> topProducts;
    private final List<MonthlySales> monthlySales;

    @Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
    public static class SalesSummary {
        private final String totalAmount;
        private final int txCount;
        private final int activeSellers;
        private final String momRate;
    }

    @Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
    public static class TopProductRow {
        private final int rank;
        private final String productName;
        private final String seller;
        private final int salesVolume;
        private final String revenue;
    }

    @Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
    public static class MonthlySales {
        private final String month;
        private final long amount;
    }
}
