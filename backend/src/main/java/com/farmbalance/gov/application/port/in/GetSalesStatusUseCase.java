package com.farmbalance.gov.application.port.in;
import com.farmbalance.gov.application.result.GovSalesResult;
public interface GetSalesStatusUseCase {
    GovSalesResult getSalesData(String govRegion);
}
