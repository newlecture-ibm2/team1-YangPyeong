package com.farmbalance.farm.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FarmDetailResponse {
    private Long id;
    private String name;
    private String address;
    private Double area;
    private String cropType;
    private String pnuCode;
}
