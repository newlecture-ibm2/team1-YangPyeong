package com.farmbalance.farm.adapter.in.web.dto;

import com.farmbalance.farm.domain.CultivationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 재배 등록 요청 DTO
 */
@Getter
@NoArgsConstructor
public class RegisterCultivationRequest {
    @NotNull(message = "작물 ID는 필수입니다.")
    private Long cropId;

    @NotNull(message = "재배 유형(씨앗/종자/모종)은 필수입니다.")
    private CultivationType cultivationType;

    @NotNull(message = "재배 면적은 필수입니다.")
    @Positive(message = "재배 면적은 0보다 커야 합니다.")
    private Double cultivationArea;

    private Double farmerEstimatedYield;
    private String yieldUnit;
}
