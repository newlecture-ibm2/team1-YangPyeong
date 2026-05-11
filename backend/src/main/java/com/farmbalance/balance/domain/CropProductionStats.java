package com.farmbalance.balance.domain;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CropProductionStats {
    private Long id;
    private String itmNm;
    private String regionCode;
    private String regionName;
    private Integer year;
    private BigDecimal cultivatedArea;
    private BigDecimal yieldPer10a;
    private BigDecimal totalProduction;
    private String unitNm;
}
