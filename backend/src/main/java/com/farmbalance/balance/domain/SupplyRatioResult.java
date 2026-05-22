package com.farmbalance.balance.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SupplyRatioResult {
    private Double ratio;
    private BalanceStatus status;
    private Integer baseYear;
    private Double currentSupplyKg;
    private Double standardYieldKg;
}
