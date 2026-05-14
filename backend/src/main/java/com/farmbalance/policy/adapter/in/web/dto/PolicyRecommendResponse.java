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
    private List<RecommendedPolicyDto> recommendedPolicies;

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
