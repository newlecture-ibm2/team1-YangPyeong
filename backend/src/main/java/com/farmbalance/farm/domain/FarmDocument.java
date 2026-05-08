package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FarmDocument {
    private String type; // LAND_CERT, BIZ_REG, FARM_REG, OTHER
    private String url;
    private String name;
}
