package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminPolicyDataResponse;
import com.farmbalance.admin.adapter.in.web.dto.PolicyDataRequest;
import com.farmbalance.admin.application.port.in.ManagePolicyDataUseCase;
import com.farmbalance.admin.application.port.in.dto.AdminPolicyDataDto;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ADM-012 정책 데이터 관리 Controller (Driving Adapter)
 * API URL: /api/admin/policy
 * 다른 도메인의 객체를 직접 import하지 않습니다.
 */
@RestController
@RequestMapping("/api/admin/policy")
@RequiredArgsConstructor
public class AdminPolicyDataController {

    private final ManagePolicyDataUseCase managePolicyDataUseCase;

    /**
     * 전체 정책 데이터 목록 조회
     * GET /api/admin/policy
     */
    @GetMapping
    public ApiResponse<List<AdminPolicyDataResponse>> getAllPolicies() {
        List<AdminPolicyDataDto> dtos = managePolicyDataUseCase.getAllPolicies();
        List<AdminPolicyDataResponse> responses = dtos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    /**
     * 정책 데이터 상세 조회
     * GET /api/admin/policy/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<AdminPolicyDataResponse> getPolicy(@PathVariable Long id) {
        AdminPolicyDataDto dto = managePolicyDataUseCase.getPolicy(id);
        return ApiResponse.ok(mapToResponse(dto));
    }

    private AdminPolicyDataResponse mapToResponse(AdminPolicyDataDto dto) {
        return AdminPolicyDataResponse.builder()
                .id(dto.getId())
                .externalId(dto.getExternalId())
                .data(dto.getData())
                .fetchedAt(dto.getFetchedAt())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .deletedAt(dto.getDeletedAt())
                .build();
    }

    /**
     * 정책 데이터 등록
     * POST /api/admin/policy
     */
    @PostMapping
    public ApiResponse<Map<String, Long>> createPolicy(@Valid @RequestBody PolicyDataRequest request) {
        Long id = managePolicyDataUseCase.createPolicy(request.getExternalId(), request.getData());
        return ApiResponse.ok(Map.of("id", id));
    }

    /**
     * 정책 데이터 수정
     * PATCH /api/admin/policy/{id}
     */
    @PatchMapping("/{id}")
    public ApiResponse<Void> updatePolicy(@PathVariable Long id,
                                           @Valid @RequestBody PolicyDataRequest request) {
        managePolicyDataUseCase.updatePolicy(id, request.getExternalId(), request.getData());
        return ApiResponse.ok(null);
    }

    /**
     * 정책 데이터 삭제
     * DELETE /api/admin/policy/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePolicy(@PathVariable Long id) {
        managePolicyDataUseCase.deletePolicy(id);
        return ApiResponse.ok(null);
    }
}
