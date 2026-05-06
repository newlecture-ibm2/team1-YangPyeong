package com.farmbalance.farm.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 수확 이력 기록 요청 DTO
 */
@Getter
@NoArgsConstructor
public class HarvestRecordRequest {

    @NotNull(message = "재배 등록 ID는 필수입니다.")
    private Long cultivationRegistrationId;

    @NotNull(message = "수확일은 필수입니다.")
    private LocalDate harvestDate;

    @NotNull(message = "수확량은 필수입니다.")
    private Double yieldAmount;

    private String yieldUnit;   // 기본값: kg
    private String grade;       // A | B | C
    private Boolean toShop;     // 상점 등록 여부
}
