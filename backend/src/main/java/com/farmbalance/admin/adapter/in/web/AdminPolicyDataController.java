package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminPolicyDataResponse;
import com.farmbalance.admin.adapter.in.web.dto.PolicyDataRequest;
import com.farmbalance.admin.application.port.in.ManagePolicyDataUseCase;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        return ApiResponse.ok(managePolicyDataUseCase.getAllPolicies());
    }

    /**
     * 정책 데이터 상세 조회
     * GET /api/admin/policy/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<AdminPolicyDataResponse> getPolicy(@PathVariable Long id) {
        return ApiResponse.ok(managePolicyDataUseCase.getPolicy(id));
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
}
