package com.farmbalance.farm.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 수확 이력 기록 커맨드
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordHarvestCommand {
    private Long cultivationRegistrationId;
    private LocalDate harvestDate;
    private Double yieldAmount;
    private String yieldUnit;
    private String grade;
    private Boolean toShop;
}
