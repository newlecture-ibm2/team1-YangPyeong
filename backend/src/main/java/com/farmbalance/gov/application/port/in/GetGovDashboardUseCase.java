package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.GovDomain.*;
import java.util.List;

/** 지자체 대시보드 조회 UseCase */
public interface GetGovDashboardUseCase {
    DashboardSummary getSummary();
    List<WarningItem> getWarningItems();
    List<MonthlySupply> getMonthlySupply();
    List<RegionDistribution> getRegionDistribution();
}
