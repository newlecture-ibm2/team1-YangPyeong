package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class UpdateFarmCommand {
    private Long farmId;
    private String name;
    private String address;
    private Double area;
    private List<Long> cropIds;
    private String bjdCode;
    private boolean isMountain;
    private String mainNo;
    private String subNo;
    private List<com.farmbalance.farm.domain.FarmDocument> documents;
    private String soilType;
    private Double ph;
    private Double organicMatter;
}
