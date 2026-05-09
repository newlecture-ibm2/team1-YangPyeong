package com.farmbalance.balance.adapter.in.web;

import com.farmbalance.balance.adapter.in.web.dto.BalanceAnalysisResponse;
import com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase;
import com.farmbalance.balance.domain.SupplyRatioResult;
import com.farmbalance.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/balance")
@RequiredArgsConstructor
@Tag(name = "수급 분석 API", description = "작물별 수급비율을 분석합니다.")
public class BalanceController {

    private final CalculateSupplyRatioUseCase calculateSupplyRatioUseCase;

    @Operation(summary = "전체 작물의 수급 분석 결과 조회", description = "양평군 내 모든 주요 작물의 수급 비율을 한꺼번에 분석합니다.")
    @GetMapping
    public ApiResponse<List<BalanceAnalysisResponse>> getAllBalanceAnalysis(
            @Parameter(description = "분석 기준 연도", required = false) @RequestParam(required = false) Integer year) {
        
        return ApiResponse.ok(
            calculateSupplyRatioUseCase.calculateAllSupplyRatios(year).entrySet().stream()
                .map(entry -> BalanceAnalysisResponse.from(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList())
        );
    }

    @Operation(summary = "특정 작물의 수급 분석 결과 조회", description = "작물명과 연도를 기준으로 양평군의 공급 비율을 분석합니다.")
    @GetMapping("/{cropName}")
    public ApiResponse<BalanceAnalysisResponse> getBalanceAnalysis(
            @Parameter(description = "분석할 작물 이름", example = "감자") @PathVariable String cropName,
            @Parameter(description = "분석 기준 연도 (미입력 시 최신 통계 자동 적용)", required = false) @RequestParam(required = false) Integer year) {

        SupplyRatioResult result = calculateSupplyRatioUseCase.calculateSupplyRatio(cropName, year);
        BalanceAnalysisResponse response = BalanceAnalysisResponse.from(cropName, result);

        return ApiResponse.ok(response);
    }
}
