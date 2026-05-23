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
    /** 맞춤 추천 정책 (TOP_RECOMMENDATION, 최대 12건) */
    private List<RecommendedPolicyDto> topRecommendations;
    /** 참고 가능 정책 (REFERENCE_COLLAPSED, 50~69점 중 TOP에 미포함) */
    private List<RecommendedPolicyDto> referencePolicies;
    /** 관련 낮음 정책 (LOW_RELEVANCE_COLLAPSED, 30~49점) */
    private List<RecommendedPolicyDto> lowRelevancePolicies;
    /** 추천 가능 정책이 부족할 때 표시할 안내 메시지 (null이면 정상) */
    private String insufficientNotice;

    /** 하위 호환용 — topRecommendations alias */
    public List<RecommendedPolicyDto> getRecommendedPolicies() {
        return topRecommendations;
    }

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
        /** 추천 점수 (100점 만점) */
        private int matchScore;
        /** 추천 등급 코드 */
        private String grade;
        /** 추천 등급 라벨 */
        private String gradeLabel;
        /** 화면 노출 그룹 */
        private String displayGroup;
        /** 추천 사유 배열 */
        private List<String> reasons;
        /** 추천 사유 (하위 호환용) */
        private String matchReason;
        private String summary;
        /** AI Top 5 선정 여부 */
        private boolean aiPick;
        /** AI가 생성한 추천 사유 (aiPick=true일 때만 값 있음) */
        private String aiReason;
    }
}
