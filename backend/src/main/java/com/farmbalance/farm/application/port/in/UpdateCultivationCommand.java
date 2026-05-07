package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UpdateCultivationCommand {
    private Long id;
    private Long cropId;
    private Double cultivationArea;
    private Double expectedYield;
    private String yieldUnit;
}
