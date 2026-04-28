package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RegisterFarmCommand {
    private Long userId; // 인증된 사용자의 ID
    private String name;
    private String address;
    private Double area;
    private String cropType;
    private String bjdCode;
    private boolean isMountain;
    private String mainNo;
    private String subNo;
}
