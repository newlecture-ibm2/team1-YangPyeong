package com.farmbalance.balance.application.port.in;

import com.farmbalance.balance.domain.SupplyRatioResult;

public interface CalculateSupplyRatioUseCase {
    SupplyRatioResult calculateSupplyRatio(String cropName, Integer year);
}
