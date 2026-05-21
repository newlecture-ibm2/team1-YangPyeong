package com.farmbalance.gov.application.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class GovCompareResult {
    private final String crop;
    private final Double prevYearTon;
    private final Double currentYearTon;
    private final Double diffTon;
    private final Double diffRate;
}
