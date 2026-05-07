package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.GetDashboardUseCase;
import com.farmbalance.admin.domain.AdminDashboard;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * ADM-011 관리자 대시보드 Controller (Driving Adapter)
 * API URL: /api/admins/dashboard
 */
@RestController
@RequestMapping("/api/admins/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final GetDashboardUseCase getDashboardUseCase;

    /**
     * 관리자 대시보드 KPI 조회
     * GET /api/admins/dashboard
     */
    @GetMapping
    public ApiResponse<AdminDashboard> getDashboard() {
        return ApiResponse.ok(getDashboardUseCase.getDashboard());
    }
}
