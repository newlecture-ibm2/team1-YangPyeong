package com.farmbalance.policy.application.port.out;

import java.util.List;
import java.util.Map;

public interface PolicyAiPort {
    /**
     * AI 서버에 정책 추천 사유 생성을 요청합니다.
     */
    AiPolicyRecommendation generatePolicyReason(Long farmerId, Map<String, Object> farmerProfile, List<Map<String, Object>> graphRelations, List<Map<String, Object>> candidatePolicies);

    record AiPolicyRecommendation(
        List<PolicyReason> reasons
    ) {}

    record PolicyReason(
        Long policyId,
        int matchScore,
        String matchReason
    ) {}
}
