package com.farmbalance.balance.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LandingStatsResult {
    private long activeUsers;
    private long totalCrops;
    private long totalRecommends;
    private long totalOrders;
}
