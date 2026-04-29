package com.farmbalance.farm.domain;

import lombok.Getter;

/**
 * 위도/경도 좌표 값 객체 (순수 POJO).
 * 카카오 로컬 API 등 외부 주소 검색 결과를 담습니다.
 */
@Getter
public class Coordinates {

    private final Double latitude;   // 위도 (y)
    private final Double longitude;  // 경도 (x)

    public Coordinates(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
