package com.farmbalance.policy.application.port.out;

import java.util.List;
import java.util.Map;

public interface PolicyAiPort {
    /**
     * AI 서버에 정책 추천 사유 생성을 요청합니다.
     */
    AiPolicyRecommendation generatePolicyReason(Long farmerId, Map<String, Object> farmerProfile, List<Map<String, Object>> graphRelations, List<Map<String, Object>> candidatePolicies);

    /**
     * AI 서버에 Top 5 큐레이션을 요청합니다.
     * 룰 기반 후보 중 LLM이 최종 5건을 선정하고 aiReason을 생성합니다.
     */
    AiTop5Curation curateTop5(Map<String, Object> farmerProfile, List<Map<String, Object>> candidatePolicies);

    record AiPolicyRecommendation(
        List<PolicyReason> reasons
    ) {}

    record PolicyReason(
        Long policyId,
        int matchScore,
        String matchReason
    ) {}

    record AiTop5Curation(
        List<TopPick> topPicks
    ) {}

    record TopPick(
        Long policyId,
        int rank,
        String aiReason
    ) {}
}
