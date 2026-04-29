package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.Coordinates;

/**
 * 주소 문자열로부터 위도/경도를 조회하는 Output Port.
 * 구현체는 adapter/out/external/ 에 위치합니다.
 */
public interface GetCoordinatesPort {

    /**
     * 주소를 기반으로 좌표(위도/경도)를 반환합니다.
     *
     * @param address 기본 주소 문자열
     * @return 위도/경도 좌표 객체
     */
    Coordinates getCoordinates(String address);
}
