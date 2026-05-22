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
            return new AiPolicyRecommendation(List.of());
        }
    }

    @Override
    public AiTop5Curation curateTop5(Map<String, Object> farmerProfile, List<Map<String, Object>> candidatePolicies) {
        try {
            Map<String, Object> requestBody = Map.of(
                "profile", farmerProfile,
                "candidatePolicies", candidatePolicies
            );

            AiTop5Curation response = aiRestClient.post()
                    .uri("/api/policy/curate-top5")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(AiTop5Curation.class);

            log.info("AI Top 5 큐레이션 완료: {}건 선정", 
                    response != null ? response.topPicks().size() : 0);
            return response != null ? response : new AiTop5Curation(List.of());
        } catch (Exception e) {
            log.warn("AI Top 5 큐레이션 실패 (룰 기반 폴백): {}", e.getMessage());
            return new AiTop5Curation(List.of());
        }
    }
}
