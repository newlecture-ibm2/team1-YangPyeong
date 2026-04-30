package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.WeatherInfo;
import java.time.LocalDate;

public interface WeatherRecordPort {
    /**
     * 특정 지점(관측소)의 특정 날짜의 날씨 정보를 조회합니다.
     * @param stnId 관측소 지점 번호
     * @param targetDate 조회할 날짜
     * @return 기온 및 강수량 정보가 담긴 WeatherInfo 객체
     */
    WeatherInfo fetchAsosDailyWeather(int stnId, LocalDate targetDate);
}
