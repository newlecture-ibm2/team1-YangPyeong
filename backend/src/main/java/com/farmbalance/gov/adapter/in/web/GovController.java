package com.farmbalance.gov.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.gov.application.port.in.*;
import com.farmbalance.gov.application.result.*;
import com.farmbalance.gov.domain.model.GovUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import com.farmbalance.gov.adapter.in.web.dto.*;

@RestController
@RequestMapping("/api/gov")
@RequiredArgsConstructor
public class GovController {

    private final GetGovUserInfoUseCase userInfoUseCase;
    private final GetGovDashboardUseCase dashboardUseCase;
    private final GetCultivationStatusUseCase cultivationUseCase;
    private final GetYearCompareUseCase yearCompareUseCase;
    private final GetSalesStatusUseCase salesUseCase;

    private GovUserInfo checkGovUser(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 인증이 필요합니다.");
        GovUserInfo info = userInfoUseCase.getGovUserInfo(userId);
        if (info == null || !"GOV".equals(info.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지자체 권한이 없습니다.");
        }
        return info;
    }

    @GetMapping("/me")
    public ApiResponse<GovUserResponse> getMe(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(GovUserResponse.from(checkGovUser(userId)));
    }

    @GetMapping("/dashboard")
    public ApiResponse<GovDashboardResponse> getDashboard(@AuthenticationPrincipal Long userId) {
        GovUserInfo user = checkGovUser(userId);
        return ApiResponse.ok(GovDashboardResponse.from(dashboardUseCase.getDashboardData(user.region())));
    }

    @GetMapping("/cultivation")
    public ApiResponse<List<GovCultivationResponse>> getCultivation(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false, name = "town") String town,
            @RequestParam(required = false) String crop) {
        GovUserInfo user = checkGovUser(userId);
        List<GovCultivationResponse> res = cultivationUseCase.getCultivationStatus(year, user.region(), town, crop).stream()
                .map(GovCultivationResponse::from).toList();
        return ApiResponse.ok(res);
    }

    @GetMapping("/compare")
    public ApiResponse<List<GovCompareResponse>> getCompare(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Integer baseYear,
            @RequestParam(required = false) Integer compareYear,
            @RequestParam(required = false) String crop) {
        GovUserInfo user = checkGovUser(userId);
        List<GovCompareResponse> res = yearCompareUseCase.getYearCompare(baseYear, compareYear, crop, user.region()).stream()
                .map(GovCompareResponse::from).toList();
        return ApiResponse.ok(res);
    }

    @GetMapping("/sales")
    public ApiResponse<GovSalesResponse> getSales(@AuthenticationPrincipal Long userId) {
        GovUserInfo user = checkGovUser(userId);
        return ApiResponse.ok(GovSalesResponse.from(salesUseCase.getSalesData(user.region())));
    }
}
