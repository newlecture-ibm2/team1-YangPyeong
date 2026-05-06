package com.farmbalance.farm.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 수확 이력 응답 DTO
 */
@Getter
@Builder
public class HarvestRecordResponse {
    private Long id;
    private Long cultivationRegistrationId;
    private LocalDate harvestDate;
    private Double yieldAmount;
    private String yieldUnit;
    private String grade;
    private Boolean toShop;
    private LocalDateTime createdAt;
}
