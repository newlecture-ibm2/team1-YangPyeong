package com.farmbalance.farm.adapter.in.web.dto;

import com.farmbalance.farm.domain.CultivationRegistration;
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
    private Double cultivationArea;
    private Double farmerEstimatedYield;
    private String yieldUnit;

    public static CultivationResponse from(CultivationRegistration domain) {
        return CultivationResponse.builder()
                .id(domain.getId())
                .farmId(domain.getFarmId())
                .cropId(domain.getCropId())
                .cultivationArea(domain.getCultivationArea())
                .farmerEstimatedYield(domain.getFarmerEstimatedYield())
                .yieldUnit(domain.getYieldUnit())
                .build();
    }
}
