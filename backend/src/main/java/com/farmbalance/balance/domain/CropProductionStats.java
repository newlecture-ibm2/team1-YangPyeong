package com.farmbalance.balance.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CropProductionStats {
    private Long id;
    private String itmNm;
    private String regionCode;
    private String regionName;
    private Integer year;
    private Double cultivatedArea;
    private Double yieldPer10a;
    private Double totalProduction;
    private String unitNm;
}
