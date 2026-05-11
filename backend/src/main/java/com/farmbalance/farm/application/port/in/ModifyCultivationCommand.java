package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ModifyCultivationCommand {
    private final Long id;
    private final Double area;
    private final Double yield;
    private final String unit;
}
