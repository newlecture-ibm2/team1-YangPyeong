package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 재배 계획 수정 완료 이벤트
 */
@Getter
@AllArgsConstructor
public class CultivationUpdatedEvent {
    private final Long id; // cultivation_registration_id
    private final Long farmId;
    private final Long cropId;
    private final Double area;
    private final Double yield;
    private final String unit;
}
