package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HarvestRecordedEvent {
    private final Long farmId;
    private final Long cultivationRegistrationId; // 추가: 상태 복구를 위해 필수
    private final Long cropId;
    private final String cropName; 
    private final Double yieldAmount;
    private final String yieldUnit;
}
