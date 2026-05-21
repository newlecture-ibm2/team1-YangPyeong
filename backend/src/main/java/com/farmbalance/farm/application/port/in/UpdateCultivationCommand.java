package com.farmbalance.farm.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCultivationCommand {
    private Long id;
    private Long cropId;
    private Double cultivationArea;
    private Double expectedYield;
    private String yieldUnit;
}
