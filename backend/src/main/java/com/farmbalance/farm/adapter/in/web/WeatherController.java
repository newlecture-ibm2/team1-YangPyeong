package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.ShortTermForecast;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherRecordPort weatherRecordPort;

    /**
     * 양평군 현재 날씨 정보 조회 (단기예보)
     * GET /api/weather/current
     */
    @GetMapping("/current")
    public ApiResponse<ShortTermForecast> getCurrentWeather(
            @RequestParam(defaultValue = "69") int nx,  // 양평군 중심 nx
            @RequestParam(defaultValue = "125") int ny  // 양평군 중심 ny
    ) {
        ShortTermForecast forecast = weatherRecordPort.fetchShortTermForecast(nx, ny);
        return ApiResponse.ok(forecast);
    }
}
