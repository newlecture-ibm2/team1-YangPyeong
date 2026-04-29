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
    private List<String> cropTypes;
    private String bjdCode;
    private boolean isMountain;
    private String mainNo;
    private String subNo;
    private String registrationNumber;
    private String documentUrl;
}
