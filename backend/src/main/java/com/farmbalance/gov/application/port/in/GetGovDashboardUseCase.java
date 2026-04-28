package com.farmbalance.gov.application.port.in;
import com.farmbalance.gov.application.result.GovDashboardResult;
public interface GetGovDashboardUseCase {
    GovDashboardResult getDashboardData(String govRegion);
}
