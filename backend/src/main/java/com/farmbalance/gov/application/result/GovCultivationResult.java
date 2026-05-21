package com.farmbalance.gov.application.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class GovCultivationResult {
    private final String region;
    private final int farmCount;
    private final double areaM2;
    private final String mainCrop;
    private final double expectedTon;
}
