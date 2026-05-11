package com.farmbalance.balance.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SupplyTrendResult {
    private final Integer year;
    private final Double supply;
    private final Double demand;
    private final Double ratio;
    private final BalanceStatus status;
}
