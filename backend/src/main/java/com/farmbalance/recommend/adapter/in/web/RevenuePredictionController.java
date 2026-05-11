package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.application.port.out.RecommendPricePort;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * 수익 예측 API 컨트롤러
 * 프론트엔드 요청을 AI 서버로 프록시합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/revenue")
public class RevenuePredictionController {

    private final RestClient aiRestClient;
    private final RecommendPricePort recommendPricePort;

    public RevenuePredictionController(
            @Qualifier("aiRestClient") RestClient aiRestClient,
            RecommendPricePort recommendPricePort) {
        this.aiRestClient = aiRestClient;
        this.recommendPricePort = recommendPricePort;
    }

    @PostMapping("/predict")
    public ResponseEntity<ApiResponse<Map<String, Object>>> predictRevenue(
            @AuthenticationPrincipal Long userId,
            @RequestBody Map<String, Object> request) {

        String cropName = (String) request.get("crop_name");
        log.info("수익 예측 요청: userId={}, crop={}", userId, cropName);

        try {
            // 1. Backend DB 캐시(또는 KAMIS API)를 이용해 가격 조회
            if (cropName != null) {
                Integer price = recommendPricePort.getRecentPricePerKg(cropName);
                if (price != null) {
                    Map<String, Object> kamisData = new HashMap<>();
                    kamisData.put("price", price);
                    kamisData.put("unit", "1kg");
                    kamisData.put("date", LocalDate.now().toString());
                    kamisData.put("crop_name", cropName);
                    
                    request.put("kamis_price", kamisData);
                    log.info("캐시된 KAMIS 가격 적용: {}원", price);
                }
            }

            // 2. AI 서버로 프록시 (aiRestClient 사용, url은 AiClientConfig에 설정됨)
            ResponseEntity<String> responseEntity = aiRestClient.post()
                    .uri("/api/revenue/predict")
                    .body(request)
                    .retrieve()
                    .toEntity(String.class);

            String rawBody = responseEntity.getBody();
            log.info("AI 서버 응답 수신 성공");

            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = mapper.readValue(rawBody, Map.class);

            return ResponseEntity.ok(ApiResponse.ok(aiResponse));

        } catch (RestClientResponseException e) {
            log.error("AI 서버 HTTP 에러: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail("REVENUE_ERROR", "AI 서버가 오류를 반환했습니다: " + e.getStatusCode()));
        } catch (Exception e) {
            log.error("AI 수익 예측 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail("REVENUE_ERROR", "수익 예측 중 시스템 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}
