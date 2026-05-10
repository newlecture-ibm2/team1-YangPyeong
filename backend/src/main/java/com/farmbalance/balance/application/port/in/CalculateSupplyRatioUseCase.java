package com.farmbalance.balance.application.port.in;

import com.farmbalance.balance.domain.SupplyRatioResult;
import java.util.List;
import java.util.Map;

public interface CalculateSupplyRatioUseCase {
    SupplyRatioResult calculateSupplyRatio(String cropName, Integer year);
    Map<String, SupplyRatioResult> calculateAllSupplyRatios(Integer year);
    void recalculate(String cropName);
    java.util.List<com.farmbalance.balance.domain.SupplyTrendResult> getSupplyTrend(String cropName);
}
