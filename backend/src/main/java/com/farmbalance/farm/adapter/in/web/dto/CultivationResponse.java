package com.farmbalance.farm.adapter.in.web.dto;

import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.CultivationType;
import lombok.Builder;
import lombok.Getter;

/**
 * 재배 정보 응답 DTO
 */
@Getter
@Builder
public class CultivationResponse {
    private Long id;
    private Long farmId;
    private Long cropId;
    private CultivationType cultivationType;
    private Double cultivationArea;
    private Double farmerEstimatedYield;
    private Double aiPredictedYield;
    private String yieldUnit;
    private Boolean verified;

    public static CultivationResponse from(CultivationRegistration domain) {
        return CultivationResponse.builder()
                .id(domain.getId())
                .farmId(domain.getFarmId())
                .cropId(domain.getCropId())
                .cultivationType(domain.getCultivationType())
                .cultivationArea(domain.getCultivationArea())
                .farmerEstimatedYield(domain.getFarmerEstimatedYield())
                .aiPredictedYield(domain.getAiPredictedYield())
                .yieldUnit(domain.getYieldUnit())
                .verified(domain.getVerified())
                .build();
    }
}
