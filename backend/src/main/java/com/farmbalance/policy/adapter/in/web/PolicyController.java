package com.farmbalance.policy.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.response.PageResponse;
import com.farmbalance.policy.adapter.in.web.dto.PolicyDetailResponse;
import com.farmbalance.policy.adapter.in.web.dto.PolicyListResponse;

import com.farmbalance.policy.application.port.in.SearchPolicyUseCase;
import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import com.farmbalance.policy.application.port.in.RecommendPolicyUseCase;
import com.farmbalance.policy.application.port.out.RegionNameResolvePort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySearchCondition;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;


/**
 * 정책 API Controller.
 * 정책 목록 조회, 상세 조회, 동기화 엔드포인트를 제공합니다.
 */
@RestController
@RequiredArgsConstructor
public class PolicyController {

    private final SearchPolicyUseCase searchPolicyUseCase;
    private final SyncPolicyUseCase syncPolicyUseCase;
    private final RecommendPolicyUseCase recommendPolicyUseCase;
    private final RegionNameResolvePort regionNameResolvePort;

    private static final BigDecimal LOW_CONFIDENCE_THRESHOLD = new BigDecimal("0.6");

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
            @RequestParam(required = false) BigDecimal minConfidence,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PolicySearchCondition condition = new PolicySearchCondition(
                keyword, regionCode, category, period, minConfidence, page, size);

        List<PolicyData> policies = searchPolicyUseCase.searchPolicies(condition);
        long totalCount = searchPolicyUseCase.countPolicies(condition);

        List<PolicyListResponse> responseList = policies.stream()
                .map(this::toListResponse)
                .toList();

        return ApiResponse.ok(PageResponse.of(responseList, page, size, totalCount));
    }

    /**
     * 맞춤 정책 추천 API (농업인 전용)
     * GET /api/policies/recommend/me
     */
    @GetMapping("/api/policies/recommend/me")
    public ApiResponse<com.farmbalance.policy.adapter.in.web.dto.PolicyRecommendResponse> recommendForMe(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        com.farmbalance.policy.adapter.in.web.dto.PolicyRecommendResponse response = recommendPolicyUseCase.recommendForUser(userId);
        return ApiResponse.ok(response);
    }

    /**
     * 정책 상세 조회 API (인증 불필요)
     * GET /api/policies/{id}
     */
    @GetMapping("/api/policies/{id}")
    public ApiResponse<PolicyDetailResponse> getPolicyDetail(@PathVariable Long id) {
        PolicyData policy = searchPolicyUseCase.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "정책을 찾을 수 없습니다: id=" + id));

        return ApiResponse.ok(toDetailResponse(policy));
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

    /**
     * 기존 정책 데이터 재정규화 API (관리자용)
     * POST /api/admin/policies/reprocess
     *
     * title=null인 기존 데이터의 content를 파싱하여
     * title/organization/target/category/region_code를 보정합니다.
     *
     * TODO: 운영 배포 전 제거 또는 ADMIN 권한 제한 필요.
     */
    @PostMapping("/api/admin/policies/reprocess")
    public ApiResponse<SyncPolicyUseCase.ReprocessResult> reprocessPolicies() {
        SyncPolicyUseCase.ReprocessResult result = syncPolicyUseCase.reprocessExisting();
        return ApiResponse.ok(result);
    }

    // ── Domain → Response DTO 변환 ──

    private PolicyListResponse toListResponse(PolicyData domain) {
        boolean isLowConfidence = isLowConfidence(domain.getConfidence());
        boolean isAnalyzed = domain.getNormalizedData() != null && !domain.getNormalizedData().isBlank();

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
                domain.getSourceUrl(),
                domain.getConfidence(),
                isLowConfidence,
                isAnalyzed
        );
    }

    private PolicyDetailResponse toDetailResponse(PolicyData domain) {
        boolean isLowConfidence = isLowConfidence(domain.getConfidence());
        boolean isAnalyzed = domain.getNormalizedData() != null && !domain.getNormalizedData().isBlank();

        // @JsonRawValue는 null → JSON null, 유효한 JSON문자열 → 객체로 직렬화
        String safeNormalized = isAnalyzed ? domain.getNormalizedData() : null;

        return new PolicyDetailResponse(
                domain.getId(),
                domain.getTitle(),
                domain.getOrganization(),
                domain.getRegionCode(),
                resolveRegionName(domain.getRegionCode()),
                domain.getCategory(),
                domain.getTarget(),
                domain.getContentSummary(),
                domain.getSupportAmount(),
                domain.getApplyStart(),
                domain.getApplyEnd(),
                domain.getSource() != null ? domain.getSource().name() : null,
                domain.getSourceUrl(),
                domain.getConfidence(),
                isLowConfidence,
                isAnalyzed,
                safeNormalized
        );
    }

    // ── 유틸리티 ──

    private boolean isLowConfidence(BigDecimal confidence) {
        return confidence != null && confidence.compareTo(LOW_CONFIDENCE_THRESHOLD) < 0;
    }

    private String resolveRegionName(String regionCode) {
        if (regionCode == null) return null;
        return regionNameResolvePort.findNameByCode(regionCode).orElse(regionCode);
    }
}
