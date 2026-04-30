package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class RegisterFarmCommand {
    private Long userId; // 인증된 사용자의 ID
    private String name;
    private String address;
    private Double area;
    private List<Long> cropIds;
    private String bjdCode;
    private boolean isMountain;
    private String mainNo;
    private String subNo;
    private String registrationNumber;
    private String documentUrl;
    private Double latitude;
    private Double longitude;
    private String soilType;
    private Double ph;
    private Double organicMatter;
}
