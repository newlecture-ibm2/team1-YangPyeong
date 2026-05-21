package com.farmbalance.gov.adapter.in.web.dto;
import com.farmbalance.gov.application.result.GovCompareResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter @Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class GovCompareResponse {
    private final String crop;
    private final Double prevYearTon;
    private final Double currentYearTon;
    private final Double diffTon;
    private final Double diffRate;

    public static GovCompareResponse from(GovCompareResult result) {
        return GovCompareResponse.builder()
            .crop(result.getCrop())
            .prevYearTon(result.getPrevYearTon())
            .currentYearTon(result.getCurrentYearTon())
            .diffTon(result.getDiffTon())
            .diffRate(result.getDiffRate())
            .build();
    }
}
