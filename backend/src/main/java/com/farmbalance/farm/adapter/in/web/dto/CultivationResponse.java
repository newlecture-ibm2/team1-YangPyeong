package com.farmbalance.farm.adapter.in.web.dto;

import com.farmbalance.farm.domain.CultivationRegistration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

/**
 * 재배 정보 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CultivationResponse {
    private Long id;
    private Long farmId;
    private Long cropId;
    private Double cultivationArea;
    private Double farmerEstimatedYield;
    private String yieldUnit;
    private String status;

    public static CultivationResponse from(CultivationRegistration domain) {
        return CultivationResponse.builder()
                .id(domain.getId())
                .farmId(domain.getFarmId())
                .cropId(domain.getCropId())
                .cultivationArea(domain.getCultivationArea())
                .farmerEstimatedYield(domain.getFarmerEstimatedYield())
                .yieldUnit(domain.getYieldUnit())
                .status(domain.getStatus() != null ? domain.getStatus().name() : null)
                .build();
    }
}
