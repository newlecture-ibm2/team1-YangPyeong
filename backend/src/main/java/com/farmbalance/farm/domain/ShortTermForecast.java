package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
public class ShortTermForecast {
    private Double tmp; // 1시간 기온
    private Double reh; // 습도
    private String pcp; // 1시간 강수량
    private Integer pty; // 강수 형태
    private Integer sky; // 하늘 상태
    private Double wsd; // 풍속
}
