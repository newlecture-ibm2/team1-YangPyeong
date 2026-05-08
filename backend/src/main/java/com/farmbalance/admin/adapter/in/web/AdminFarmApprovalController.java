package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminFarmApprovalResponse;
import com.farmbalance.admin.adapter.in.web.dto.RejectRequest;
import com.farmbalance.admin.application.port.in.ManageFarmApprovalUseCase;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ADM-002 농부 승인/반려 Controller (Driving Adapter)
 * API URL: /api/admin/farms
 */
@RestController
@RequestMapping("/api/admin/farms")
@RequiredArgsConstructor
public class AdminFarmApprovalController {

    private final ManageFarmApprovalUseCase manageFarmApprovalUseCase;

    /**
     * 상태별 승인 요청 목록 조회
     * GET /api/admin/farms?status=PENDING
     */
    @GetMapping
    public ApiResponse<List<AdminFarmApprovalResponse>> getApprovals(
            @RequestParam(required = false, defaultValue = "PENDING") String status) {
        return ApiResponse.ok(manageFarmApprovalUseCase.getApprovalsByStatus(status));
    }

    /**
     * 농장 승인 (farm → APPROVED, user → FARMER)
     * PATCH /api/admin/farms/{farmId}/approve
     */
    @PatchMapping("/{farmId}/approve")
    public ApiResponse<Void> approve(@PathVariable Long farmId) {
        manageFarmApprovalUseCase.approve(farmId);
        return ApiResponse.ok(null);
    }

    /**
     * 농장 반려 (farm → REJECTED + 반려 사유 저장)
     * PATCH /api/admin/farms/{farmId}/reject
     */
    @PatchMapping("/{farmId}/reject")
    public ApiResponse<Void> reject(@PathVariable Long farmId,
                                     @Valid @RequestBody RejectRequest request) {
        manageFarmApprovalUseCase.reject(farmId, request.getReason());
        return ApiResponse.ok(null);
    }
}
