package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FarmRegisteredEvent {
    private final Long farmId;
    private final String farmName;
}
