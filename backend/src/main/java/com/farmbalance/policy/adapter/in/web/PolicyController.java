package com.farmbalance.policy.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.response.PageResponse;
import com.farmbalance.policy.adapter.in.web.dto.PolicyListResponse;
import com.farmbalance.policy.application.port.in.SearchPolicyUseCase;
import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import com.farmbalance.policy.application.port.out.RegionNameResolvePort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 정책 API Controller.
 * 정책 목록 조회 및 동기화 엔드포인트를 제공합니다.
 */
@RestController
@RequiredArgsConstructor
public class PolicyController {

    private final SearchPolicyUseCase searchPolicyUseCase;
    private final SyncPolicyUseCase syncPolicyUseCase;
    private final RegionNameResolvePort regionNameResolvePort;

    /**
     * 정책 목록 조회 API (인증 불필요)
     * GET /api/policies
     */
    @GetMapping("/api/policies")
    public ApiResponse<PageResponse<PolicyListResponse>> searchPolicies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String period,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PolicySearchCondition condition = new PolicySearchCondition(
                keyword, regionCode, category, period, page, size);

        List<PolicyData> policies = searchPolicyUseCase.searchPolicies(condition);
        long totalCount = searchPolicyUseCase.countPolicies(condition);

        List<PolicyListResponse> responseList = policies.stream()
                .map(this::toResponse)
                .toList();

        return ApiResponse.ok(PageResponse.of(responseList, page, size, totalCount));
    }

    /**
     * 정책 동기화 API (관리자용)
     * POST /api/admin/policies/sync
     *
     * TODO: 운영 시 @PreAuthorize("hasRole('ADMIN')") 또는 SecurityConfig에서
     *       .requestMatchers("/api/admin/**").hasRole("ADMIN") 으로 권한 제한 필요.
     *       현재는 인증 미완성으로 임시 permitAll 상태.
     */
    @PostMapping("/api/admin/policies/sync")
    public ApiResponse<SyncPolicyUseCase.SyncResult> syncPolicies() {
        SyncPolicyUseCase.SyncResult result = syncPolicyUseCase.syncPolicies();
        return ApiResponse.ok(result);
    }

    // ── Domain → Response DTO 변환 ──

    private PolicyListResponse toResponse(PolicyData domain) {
        return new PolicyListResponse(
                domain.getId(),
                domain.getTitle(),
                domain.getOrganization(),
                domain.getRegionCode(),
                resolveRegionName(domain.getRegionCode()),
                domain.getCategory(),
                domain.getTarget(),
                domain.getContentSummary(),
                domain.getSupportAmount(),
                domain.getApplyEnd(),
                domain.getSource() != null ? domain.getSource().name() : null,
                domain.getSourceUrl()
        );
    }

    /**
     * region_code로 지역명을 조회합니다.
     * regions 마스터 테이블 기반 — 지역 하드코딩 없음.
     */
    private String resolveRegionName(String regionCode) {
        if (regionCode == null) return null;
        return regionNameResolvePort.findNameByCode(regionCode).orElse(regionCode);
    }
}
