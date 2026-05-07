package com.farmbalance.gov.application.result;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class GovCompareResult {
    private final String crop;
    private final double prevYearTon;
    private final double currentYearTon;
    private final double diffTon;
    private final double diffRate;
}
