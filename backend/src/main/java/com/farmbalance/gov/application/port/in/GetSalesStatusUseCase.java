package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.GovDomain.*;
import java.util.List;

/** 판매 현황 조회 UseCase */
public interface GetSalesStatusUseCase {
    SalesSummary getSalesSummary();
    List<TopProductRow> getTopProducts();
    List<MonthlySales> getMonthlySales();
}
