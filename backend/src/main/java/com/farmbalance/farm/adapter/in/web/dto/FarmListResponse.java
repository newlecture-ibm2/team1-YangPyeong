package com.farmbalance.farm.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class FarmListResponse {
    private Long id;
    private String name;
    private String address;
    private Double area;
    private List<String> cropTypes;
    private String certificationStatus;
}
