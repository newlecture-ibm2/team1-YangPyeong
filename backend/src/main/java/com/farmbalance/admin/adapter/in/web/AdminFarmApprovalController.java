package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminFarmApprovalResponse;
import com.farmbalance.admin.adapter.in.web.dto.RejectRequest;
import com.farmbalance.admin.application.port.in.ManageFarmApprovalUseCase;
import com.farmbalance.admin.application.port.in.dto.AdminFarmApprovalDto;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

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
        List<AdminFarmApprovalDto> dtos = manageFarmApprovalUseCase.getApprovalsByStatus(status);
        List<AdminFarmApprovalResponse> responses = dtos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    private AdminFarmApprovalResponse mapToResponse(AdminFarmApprovalDto dto) {
        return AdminFarmApprovalResponse.builder()
                .farmId(dto.getFarmId())
                .farmName(dto.getFarmName())
                .address(dto.getAddress())
                .areaSize(dto.getAreaSize())
                .documents(dto.getDocuments() != null ? dto.getDocuments().stream()
                        .map(doc -> com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto.builder()
                                .type(doc.getType())
                                .url(doc.getUrl())
                                .name(doc.getName())
                                .build())
                        .collect(Collectors.toList()) : null)
                .status(dto.getStatus())
                .createdAt(dto.getCreatedAt())
                .userId(dto.getUserId())
                .userName(dto.getUserName())
                .userEmail(dto.getUserEmail())
                .userPhone(dto.getUserPhone())
                .build();
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

    /**
     * 농장 삭제 (관리자 강제 삭제 - Soft Delete)
     * DELETE /api/admin/farms/{farmId}
     */
    @DeleteMapping("/{farmId}")
    public ApiResponse<Void> deleteFarm(@PathVariable Long farmId) {
        manageFarmApprovalUseCase.deleteFarm(farmId);
        return ApiResponse.ok(null);
    }
}
