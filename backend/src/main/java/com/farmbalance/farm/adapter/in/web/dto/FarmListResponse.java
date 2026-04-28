package com.farmbalance.farm.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FarmListResponse {
    private Long id;
    private String name;
    private String address;
    private String cropType;
}
