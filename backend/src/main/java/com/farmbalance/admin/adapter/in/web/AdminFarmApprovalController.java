package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.ManageFarmApprovalUseCase;
import com.farmbalance.admin.domain.FarmApprovalView;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ADM-002 농부 승인/반려 Controller (Driving Adapter)
 * API URL: /api/admins/approvals
 */
@RestController
@RequestMapping("/api/admins/approvals")
@RequiredArgsConstructor
public class AdminFarmApprovalController {

    private final ManageFarmApprovalUseCase manageFarmApprovalUseCase;

    /**
     * 상태별 승인 요청 목록 조회
     * GET /api/admins/approvals?status=PENDING
     */
    @GetMapping
    public ApiResponse<List<FarmApprovalView>> getApprovals(
            @RequestParam(required = false, defaultValue = "PENDING") String status) {
        return ApiResponse.ok(manageFarmApprovalUseCase.getApprovalsByStatus(status));
    }

    /**
     * 농장 승인 (farm → APPROVED, user → FARMER)
     * PATCH /api/admins/approvals/{farmId}/approve
     */
    @PatchMapping("/{farmId}/approve")
    public ApiResponse<Void> approve(@PathVariable Long farmId) {
        manageFarmApprovalUseCase.approve(farmId);
        return ApiResponse.ok(null);
    }

    /**
     * 농장 반려 (farm → REJECTED)
     * PATCH /api/admins/approvals/{farmId}/reject
     */
    @PatchMapping("/{farmId}/reject")
    public ApiResponse<Void> reject(@PathVariable Long farmId) {
        manageFarmApprovalUseCase.reject(farmId);
        return ApiResponse.ok(null);
    }
}
