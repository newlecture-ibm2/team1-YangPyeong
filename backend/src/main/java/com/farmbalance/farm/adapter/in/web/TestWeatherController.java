package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.application.service.DailyWeatherRecordScheduler;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/test/weather")
@RequiredArgsConstructor
@Tag(name = "기상청 API 테스트", description = "기상청 데이터 연동 및 수동 동기화 확인용") // 1. 그룹 태그 추가
public class TestWeatherController {

    private final DailyWeatherRecordScheduler weatherRecordScheduler;

    /**
     * 기상 데이터 수동 동기화 트리거 (테스트용)
     * GET /api/test/weather/sync
     */
    @Operation(summary = "기상 데이터 수동 동기화", description = "어제의 날씨 데이터를 기상청에서 가져와 DB에 강제로 저장합니다.") // 2. 상세 설명 추가
    @GetMapping("/sync")
    public ApiResponse<String> syncWeatherManual() {
        log.info("[TestAPI] 기상 데이터 수동 동기화를 시작합니다.");
        try {
            weatherRecordScheduler.recordDailyWeather();
            return ApiResponse.ok("기상 데이터 동기화 프로세스가 실행되었습니다. 서버 로그와 DB(history 테이블)를 확인하세요.");
        } catch (Exception e) {
            log.error("[TestAPI] 동기화 중 오류 발생", e);
            return ApiResponse.fail(ErrorCode.INTERNAL_ERROR.getCode(), "동기화 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
