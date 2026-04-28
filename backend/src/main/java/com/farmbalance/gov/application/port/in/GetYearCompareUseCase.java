package com.farmbalance.gov.application.port.in;
import com.farmbalance.gov.application.result.GovCompareResult;
import java.util.List;
public interface GetYearCompareUseCase {
    List<GovCompareResult> getYearCompare(Integer baseYear, Integer compareYear, String crop, String govRegion);
}
