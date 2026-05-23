package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.application.service.CurrentWeatherSyncScheduler;
import com.farmbalance.farm.domain.ShortTermForecast;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final CurrentWeatherSyncScheduler currentWeatherSyncScheduler;

    /**
     * 양평군 현재 날씨 정보 조회 (캐시된 단기예보)
     * GET /api/weather/current
     */
    @GetMapping("/current")
    public ApiResponse<ShortTermForecast> getCurrentWeather() {
        // 스케줄러가 주기적으로 갱신해둔 캐시 데이터 반환 (직접 외부 API 호출 안 함)
        ShortTermForecast forecast = currentWeatherSyncScheduler.getCurrentForecast();
        return ApiResponse.ok(forecast);
    }
}
