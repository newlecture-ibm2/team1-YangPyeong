package com.farmbalance.policy.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PolicyRecommendResponse {
    private FarmerProfileSummary farmerProfile;
    /** AI 사유가 포함된 상위 추천 정책 (TOP 5) */
    private List<RecommendedPolicyDto> recommendedPolicies;
    /** 규칙 기반 사유만 포함된 관련 정책 (최대 20개) */
    private List<RecommendedPolicyDto> relatedPolicies;
    /** 추천 가능 정책이 부족할 때 표시할 안내 메시지 (null이면 정상) */
    private String insufficientNotice;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmerProfileSummary {
        private String name;
        private String regionName;
        private int farmCount;
        private double totalArea;
        private List<String> crops;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedPolicyDto {
        private Long policyId;
        private String title;
        private String category;
        private String supportAmount;
        private String organization;
        private String applyEnd;
        private String sourceUrl;
        private int matchScore;
        private String matchReason;
        private String summary;
    }
}
