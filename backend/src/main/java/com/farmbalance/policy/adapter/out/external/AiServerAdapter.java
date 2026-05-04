package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.farm.application.port.out.PredictYieldPort;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * AI 서버 연동 어댑터 (External Adapter)
 * 에이전트 규칙에 따라 policy 도메인에 위치함
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiServerAdapter implements PredictYieldPort {

    private final RestClient aiRestClient;

    @Override
    public Double predictYield(Long cropId, Double area, String cultivationType) {
        log.info("Requesting yield prediction to AI server: cropId={}, area={}, type={}", cropId, area, cultivationType);
        
        try {
            PredictYieldRequest request = new PredictYieldRequest(cropId, area, cultivationType);
            
            PredictYieldResponse response = aiRestClient.post()
                    .uri("/api/analysis/predict-yield")
                    .body(request)
                    .retrieve()
                    .body(PredictYieldResponse.class);
                    
            if (response == null) {
                log.warn("AI server returned empty response for yield prediction");
                return 0.0;
            }
            
            log.info("Received predicted yield from AI server: {}", response.getPredictedYield());
            return response.getPredictedYield();
            
        } catch (Exception e) {
            log.error("Error occurred while calling AI server for yield prediction", e);
            return 0.0;
        }
    }

    /**
     * AI 서버 요청 DTO
     */
    @Getter
    @RequiredArgsConstructor
    private static class PredictYieldRequest {
        private final Long crop_id;
        private final Double area;
        private final String cultivation_type;
    }

    /**
     * AI 서버 응답 DTO
     */
    @Getter
    private static class PredictYieldResponse {
        private Double predicted_yield;
    }
}
