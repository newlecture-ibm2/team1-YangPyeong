package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class FarmRegisteredEvent {
    private final Long farmId;
    private final String farmName;
    private final List<String> cropTypes;
}
