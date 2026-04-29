package com.farmbalance.gov.application.result;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class GovCultivationResult {
    private final String region;
    private final int farmCount;
    private final double areaM2;
    private final String mainCrop;
    private final double expectedTon;
}
