package com.farmbalance.gov.adapter.in.web.dto;
import com.farmbalance.gov.application.result.GovSalesResult;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter @Builder
public class GovSalesResponse {
    private final GovSalesResult.SalesSummary summary;
    private final List<GovSalesResult.TopProductRow> topProducts;
    private final List<GovSalesResult.MonthlySales> monthlySales;

    public static GovSalesResponse from(GovSalesResult result) {
        return GovSalesResponse.builder()
            .summary(result.getSummary())
            .topProducts(result.getTopProducts())
            .monthlySales(result.getMonthlySales())
            .build();
    }
}
