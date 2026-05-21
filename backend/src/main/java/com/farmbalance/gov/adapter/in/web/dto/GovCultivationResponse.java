package com.farmbalance.gov.adapter.in.web.dto;
import com.farmbalance.gov.application.result.GovCultivationResult;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class GovCultivationResponse {
    private final String region;
    private final int farmCount;
    private final double areaM2;
    private final String mainCrop;
    private final double expectedTon;

    public static GovCultivationResponse from(GovCultivationResult result) {
        return GovCultivationResponse.builder()
            .region(result.getRegion())
            .farmCount(result.getFarmCount())
            .areaM2(result.getAreaM2())
            .mainCrop(result.getMainCrop())
            .expectedTon(result.getExpectedTon())
            .build();
    }
}
