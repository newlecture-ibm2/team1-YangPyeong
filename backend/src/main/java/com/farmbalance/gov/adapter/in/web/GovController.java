package com.farmbalance.gov.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.gov.application.port.in.*;
import com.farmbalance.gov.domain.model.GovDomain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * 지자체 Controller (Driving Adapter)
 * 조회 전용 엔드포인트 — 실 DB 데이터 반환
 */
@RestController
@RequestMapping("/api/gov")
@RequiredArgsConstructor
public class GovController {

    private final GetGovDashboardUseCase dashboardUseCase;
    private final GetCultivationStatusUseCase cultivationUseCase;
    private final GetYearCompareUseCase yearCompareUseCase;
    private final GetSalesStatusUseCase salesUseCase;

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> getDashboard() {
        return ApiResponse.ok(Map.of(
            "summary", dashboardUseCase.getSummary(),
            "warningItems", dashboardUseCase.getWarningItems(),
            "monthlySupply", dashboardUseCase.getMonthlySupply(),
            "regionDistribution", dashboardUseCase.getRegionDistribution()
        ));
    }

    @GetMapping("/cultivation")
    public ApiResponse<List<CultivationRow>> getCultivation(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String crop) {
        return ApiResponse.ok(cultivationUseCase.getCultivationStatus(year, region, crop));
    }

    @GetMapping("/compare")
    public ApiResponse<List<YearCompareRow>> getCompare(
            @RequestParam(required = false) Integer baseYear,
            @RequestParam(required = false) Integer compareYear,
            @RequestParam(required = false) String crop) {
        return ApiResponse.ok(yearCompareUseCase.getYearCompare(baseYear, compareYear, crop));
    }

    @GetMapping("/sales")
    public ApiResponse<Map<String, Object>> getSales() {
        return ApiResponse.ok(Map.of(
            "summary", salesUseCase.getSalesSummary(),
            "topProducts", salesUseCase.getTopProducts(),
            "monthlySales", salesUseCase.getMonthlySales()
        ));
    }
}
