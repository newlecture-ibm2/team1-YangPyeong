package com.farmbalance.balance.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplyTrendResult {
    private Integer year;
    private Double supply;
    private Double demand;
    private Double ratio;
    private BalanceStatus status;
}
