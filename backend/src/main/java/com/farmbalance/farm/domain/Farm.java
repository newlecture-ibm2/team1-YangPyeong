package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Farm {
    private Long id;
    private Long userId;
    private String name;
    private String address;
    private Double area;
    private String cropType;
    private String bjdCode;
    private String pnuCode;
}
