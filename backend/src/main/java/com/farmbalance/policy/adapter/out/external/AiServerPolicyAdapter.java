package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyAiPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AiServerPolicyAdapter implements PolicyAiPort {

    private final RestClient aiRestClient;

    public AiServerPolicyAdapter(@Qualifier("aiRestClient") RestClient aiRestClient) {
        this.aiRestClient = aiRestClient;
    }

    @Override
    public AiPolicyRecommendation generatePolicyReason(Long farmerId, Map<String, Object> farmerProfile, List<Map<String, Object>> graphRelations, List<Map<String, Object>> candidatePolicies) {
        try {
            Map<String, Object> requestBody = Map.of(
                "farmer_id", farmerId,
                "profile", farmerProfile,
                "graph_relations", graphRelations,
                "candidate_policies", candidatePolicies
            );

            AiPolicyRecommendation response = aiRestClient.post()
                    .uri("/api/policy/recommend-reasons")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(AiPolicyRecommendation.class);

            return response;
        } catch (Exception e) {
            log.error("AI 정책 추천 사유 생성 실패: {}", e.getMessage(), e);
            return new AiPolicyRecommendation(List.of()); // 실패 시 빈 목록 반환 (기본 룰 기반 사용)
        }
    }
}
