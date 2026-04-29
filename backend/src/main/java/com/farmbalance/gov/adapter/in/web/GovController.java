package com.farmbalance.gov.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.gov.application.port.in.*;
import com.farmbalance.gov.application.port.out.RegionQueryPort;
import com.farmbalance.gov.application.result.*;
import com.farmbalance.gov.domain.model.GovUserInfo;
import com.farmbalance.gov.domain.model.Region;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final RegionQueryPort regionQueryPort;

    private GovUserInfo checkGovUser(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 인증이 필요합니다.");
        GovUserInfo info = userInfoUseCase.getGovUserInfo(userId);
        if (info == null || !"GOV".equals(info.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지자체 권한이 없습니다.");
        }
        return info;
    }

    /**
     * 로그인한 GOV 사용자의 관할 지역 코드를 반환합니다.
     * users.region_code → regions 마스터 테이블 기반
     */
    private String resolveRegion(GovUserInfo user) {
        return user.regionCode();
    }

    @GetMapping("/me")
    public ApiResponse<GovUserResponse> getMe(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(GovUserResponse.from(checkGovUser(userId)));
    }

    @GetMapping("/dashboard")
    public ApiResponse<GovDashboardResponse> getDashboard(@AuthenticationPrincipal Long userId) {
        GovUserInfo user = checkGovUser(userId);
        return ApiResponse.ok(GovDashboardResponse.from(dashboardUseCase.getDashboardData(resolveRegion(user))));
    }

    @GetMapping("/cultivation")
    public ApiResponse<List<GovCultivationResponse>> getCultivation(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false, name = "town") String town,
            @RequestParam(required = false) String crop) {
        GovUserInfo user = checkGovUser(userId);
        List<GovCultivationResponse> res = cultivationUseCase.getCultivationStatus(year, resolveRegion(user), town, crop).stream()
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
        List<GovCompareResponse> res = yearCompareUseCase.getYearCompare(baseYear, compareYear, crop, resolveRegion(user)).stream()
                .map(GovCompareResponse::from).toList();
        return ApiResponse.ok(res);
    }

    @GetMapping("/sales")
    public ApiResponse<GovSalesResponse> getSales(@AuthenticationPrincipal Long userId) {
        GovUserInfo user = checkGovUser(userId);
        return ApiResponse.ok(GovSalesResponse.from(salesUseCase.getSalesData(resolveRegion(user))));
    }

    /**
     * 관할 읍면동 목록 조회 API (신규)
     * 프론트엔드의 읍면 필터 하드코딩(TOWN_OPTIONS)을 대체합니다.
     */
    @GetMapping("/regions")
    public ApiResponse<List<RegionResponse>> getTowns(@AuthenticationPrincipal Long userId) {
        GovUserInfo user = checkGovUser(userId);
        String regionCode = user.regionCode() != null && !user.regionCode().isBlank()
                ? user.regionCode() : "4183";
        List<RegionResponse> towns = regionQueryPort.findTownsByParentCode(regionCode).stream()
                .map(r -> new RegionResponse(r.getCode(), r.getName()))
                .toList();
        return ApiResponse.ok(towns);
    }
}
