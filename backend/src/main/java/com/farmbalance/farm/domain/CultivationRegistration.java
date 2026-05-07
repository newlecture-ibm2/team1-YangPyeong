package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 재배 등록 도메인 객체 (순수 Java — Framework 의존성 없음)
 * 농장별 작물 재배 등록 정보를 나타냅니다.
 */
@Getter
@Builder
public class CultivationRegistration {
    private final Long id;
    private final Long farmId;
    private final Long cropId;
    private final String cropName; // 출력용: JOIN 결과
    private final Double cultivationArea;
    private final Double farmerEstimatedYield;
    private final String yieldUnit;
    private final CultivationStatus status; // 재배 상태 (ACTIVE, COMPLETED)
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
}
