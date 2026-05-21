package com.farmbalance.farm.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    // 재배 등록 상세 정보 추가
    private List<RegisterFarmCommand.CultivationDetail> cultivations;
}
