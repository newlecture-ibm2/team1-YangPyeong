package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HarvestRecordedEvent {
    private final Long farmId;
    private final Long cropId;
    private final Double yieldAmount;
    private final String yieldUnit;
}
