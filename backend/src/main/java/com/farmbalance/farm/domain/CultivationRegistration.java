package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;

/**
 * 재배 등록 도메인 객체 (순수 Java — Framework 의존성 없음)
 * 농장별 작물 재배 등록 정보를 나타냅니다.
 */
@Getter
@Builder
public class CultivationRegistration {
    private Long id;
    private Long farmId;
    private Long cropId;
    private String cropName; // 출력용: JOIN 결과
    private Double cultivationArea;
    private Double farmerEstimatedYield;
    private String yieldUnit;
}
