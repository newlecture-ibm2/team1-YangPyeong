package com.farmbalance.farm.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@AllArgsConstructor
public class FarmDocument {
    private String type; // LAND_CERT, BIZ_REG, FARM_REG, OTHER
    private String url;
    private String name;
}
