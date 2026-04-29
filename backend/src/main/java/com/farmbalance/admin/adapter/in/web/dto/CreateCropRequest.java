package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 작물 등록 요청 DTO
 */
@Getter
@NoArgsConstructor
public class CreateCropRequest {

    private Long categoryId;
    private String name;
    private Integer growthDays;
    private BigDecimal yieldPerSqm;
    private BigDecimal avgCostPerSqm;
    private String climateConditions;
}
