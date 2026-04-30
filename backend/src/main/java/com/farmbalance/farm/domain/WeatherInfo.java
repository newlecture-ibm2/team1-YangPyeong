package com.farmbalance.farm.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherInfo {
    private Double avgTa; // 평균 기온
    private Double sumRn; // 일 강수량
}
