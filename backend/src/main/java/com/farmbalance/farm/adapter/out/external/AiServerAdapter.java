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

import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.multipart.MultipartFile;
import com.farmbalance.farm.application.port.out.AnalyzeFarmDocumentPort;
import com.farmbalance.farm.domain.FarmDocumentData;

/**
 * AI 서버 연동 어댑터 (External Adapter)
 * 현재는 재배 수확량 예측을 담당하므로 farm 도메인에 위치함
 */
@Slf4j
@Component
public class AiServerAdapter implements PredictYieldPort, AnalyzeFarmDocumentPort {

    private final RestClient aiRestClient;

    public AiServerAdapter(@org.springframework.beans.factory.annotation.Qualifier("aiRestClient") RestClient aiRestClient) {
        this.aiRestClient = aiRestClient;
    }

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

    @Override
    public FarmDocumentData analyzeDocument(MultipartFile file) {
        log.info("Requesting document OCR to AI server: filename={}", file.getOriginalFilename());
        
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", file.getResource());
            
            FarmDocumentData response = aiRestClient.post()
                    .uri("/api/ocr/farm-document")
                    .body(builder.build())
                    .retrieve()
                    .body(FarmDocumentData.class);
                    
            if (response == null) {
                log.warn("AI server returned empty response for document OCR");
                return FarmDocumentData.builder()
                        .isValid(false)
                        .errorMessage("AI 서버 응답이 없습니다.")
                        .build();
            }
            
            log.info("Received OCR result from AI server: isValid={}", response.getIsValid());
            return response;
            
        } catch (Exception e) {
            log.error("Error occurred while calling AI server for document OCR", e);
            return FarmDocumentData.builder()
                    .isValid(false)
                    .errorMessage("OCR 처리 중 백엔드 시스템 오류가 발생했습니다.")
                    .build();
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
