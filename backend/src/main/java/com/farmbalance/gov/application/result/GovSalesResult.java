package com.farmbalance.gov.application.result;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class GovSalesResult {
    private final SalesSummary summary;
    private final List<TopProductRow> topProducts;
    private final List<MonthlySales> monthlySales;

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
