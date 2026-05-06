package com.farmbalance.farm.adapter.out.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.farmbalance.farm.application.port.out.PredictYieldPort;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * AI 서버 연동 어댑터 (External Adapter)
 * 현재는 재배 수확량 예측을 담당하므로 farm 도메인에 위치함
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
    @AllArgsConstructor
    private static class PredictYieldRequest {
        @JsonProperty("crop_id")
        private final Long cropId;
        
        private final Double area;
        
        @JsonProperty("cultivation_type")
        private final String cultivationType;
    }

    /**
     * AI 서버 응답 DTO
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    private static class PredictYieldResponse {
        @JsonProperty("predicted_yield")
        private Double predictedYield;
    }
}
