package com.farmbalance.farm.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 수확 이력 도메인 객체 (순수 Java — Framework 의존성 없음)
 * 재배 등록별 수확 기록을 나타냅니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestRecord {
    private Long id;
    private Long cultivationRegistrationId;
    private LocalDate harvestDate;
    private Double yieldAmount;       // 수확량
    private String yieldUnit;         // g | kg | ton
    private String grade;             // A | B | C
    private Boolean toShop;           // 상점 등록 여부
    private LocalDateTime createdAt;

    public static HarvestRecord create(Long cultivationId, Double yieldAmount, LocalDate harvestDate, 
                                       String yieldUnit, String grade, Boolean toShop, Double predictedYield) {
        
        if (yieldAmount == null || yieldAmount <= 0) {
            throw new com.farmbalance.global.error.BusinessException(
                com.farmbalance.global.error.ErrorCode.INVALID_HARVEST_YIELD);
        }

        if (predictedYield != null && yieldAmount > (predictedYield * 3)) {
            throw new com.farmbalance.global.error.BusinessException(
                com.farmbalance.global.error.ErrorCode.INVALID_HARVEST_YIELD);
        }

        return HarvestRecord.builder()
                .cultivationRegistrationId(cultivationId)
                .harvestDate(harvestDate)
                .yieldAmount(yieldAmount)
                .yieldUnit(yieldUnit != null ? yieldUnit : "kg")
                .grade(grade)
                .toShop(toShop != null ? toShop : false)
                .build();
    }
}
