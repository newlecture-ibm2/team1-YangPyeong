package com.farmbalance.farm.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherData {
    private Double avgTa; // 평균 기온
    private Double minTa; // 최저 기온
    private Double maxTa; // 최고 기온
    private Double sumRn; // 일 강수량
    private Double avgRhm; // 평균 상대습도(%)
}

