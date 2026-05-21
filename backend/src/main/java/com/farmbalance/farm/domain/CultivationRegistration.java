package com.farmbalance.farm.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 재배 등록 도메인 객체 (순수 Java — Framework 의존성 없음)
 * 농장별 작물 재배 등록 정보를 나타냅니다.
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class CultivationRegistration {
    private final Long id;
    private final Long farmId;
    private final Long cropId;
    private final String cropName; // 출력용: JOIN 결과
    private Double cultivationArea;
    private Double farmerEstimatedYield;
    private String yieldUnit;
    private CultivationStatus status; // 재배 상태 (ACTIVE, COMPLETED)
    private LocalDate sowingDate;
    private boolean inSeason;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public boolean isCompleted() {
        return this.status == CultivationStatus.COMPLETED;
    }

    public void completeHarvest() {
        this.status = CultivationStatus.COMPLETED;
    }

    /**
     * 재배 계획 수정 (FRM-011)
     * 핵심 비즈니스 규칙: ACTIVE 상태에서만 수정 가능
     */
    public void updatePlan(Double newArea, Double newYield, String newUnit) {
        if (this.status != CultivationStatus.ACTIVE) {
            throw new com.farmbalance.global.error.BusinessException(
                com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "진행 중(ACTIVE)인 재배 계획만 수정할 수 있습니다.");
        }
        
        if (newArea != null && newArea <= 0) {
            throw new com.farmbalance.global.error.BusinessException(
                com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "면적은 0보다 커야 합니다.");
        }
        if (newYield != null && newYield <= 0) {
             throw new com.farmbalance.global.error.BusinessException(
                com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "예상 수확량은 0보다 커야 합니다.");
        }

        if (newArea != null) this.cultivationArea = newArea;
        if (newYield != null) this.farmerEstimatedYield = newYield;
        if (newUnit != null) this.yieldUnit = newUnit;
    }
}
