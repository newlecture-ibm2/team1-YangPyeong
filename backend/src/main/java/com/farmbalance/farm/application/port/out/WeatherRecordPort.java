package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.ShortTermForecast;
import com.farmbalance.farm.domain.WeatherData;
import java.time.LocalDate;

public interface WeatherRecordPort {
    /**
     * 특정 지점(관측소)의 특정 날짜의 날씨 정보를 조회합니다.
     */
    WeatherData fetchAsosDailyWeather(int stnId, LocalDate targetDate);


    /**
     * 특정 격자 좌표의 단기예보를 조회합니다.
     * @param nx 격자 X
     * @param ny 격자 Y
     */
    ShortTermForecast fetchShortTermForecast(int nx, int ny);
}

