package com.farmbalance.gov.application.result;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class GovCompareResult {
    private final String crop;
    private final Double prevYearTon;
    private final Double currentYearTon;
    private final Double diffTon;
    private final Double diffRate;
}
