package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

/**
 * 재배 등록 도메인 (순수 Java 객체)
 */
@Getter
@Builder
public class CultivationRegistration {
    private Long id;
    private Long farmId;
    private Long cropId;
    private CultivationType cultivationType;
    private Double cultivationArea;
    private Double farmerEstimatedYield;
    private Double aiPredictedYield;
    private String yieldUnit;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateAiPredictedYield(Double predictedYield) {
        this.aiPredictedYield = predictedYield;
    }

    public void verify() {
        this.verified = true;
    }
}
