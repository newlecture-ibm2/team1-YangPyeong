package com.farmbalance.gov.adapter.in.web.dto;
import com.farmbalance.gov.application.result.GovDashboardResult;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter @Builder
public class GovDashboardResponse {
    private final GovDashboardResult.DashboardSummary summary;
    private final List<GovDashboardResult.WarningItem> warningItems;
    private final List<GovDashboardResult.MonthlySupply> monthlySupply;
    private final List<GovDashboardResult.RegionDistribution> regionDistribution;

    public static GovDashboardResponse from(GovDashboardResult result) {
        return GovDashboardResponse.builder()
            .summary(result.getSummary())
            .warningItems(result.getWarningItems())
            .monthlySupply(result.getMonthlySupply())
            .regionDistribution(result.getRegionDistribution())
            .build();
    }
}
