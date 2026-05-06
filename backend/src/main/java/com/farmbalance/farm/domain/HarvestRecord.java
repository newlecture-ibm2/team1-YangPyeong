package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 수확 이력 도메인 객체 (순수 Java — Framework 의존성 없음)
 * 재배 등록별 수확 기록을 나타냅니다.
 */
@Getter
@Builder
public class HarvestRecord {
    private Long id;
    private Long cultivationRegistrationId;
    private LocalDate harvestDate;
    private Double yieldAmount;       // 수확량
    private String yieldUnit;         // g | kg | ton
    private String grade;             // A | B | C
    private Boolean toShop;           // 상점 등록 여부
    private LocalDateTime createdAt;
}
