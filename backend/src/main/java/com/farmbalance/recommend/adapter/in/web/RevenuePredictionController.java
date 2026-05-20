package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.adapter.out.external.KamisCropNameResolver;
import com.farmbalance.recommend.adapter.out.persistence.RevenueCultivationLookup;
import com.farmbalance.recommend.application.port.out.RecommendPricePort;
import com.farmbalance.recommend.application.service.FarmRevenuePredictionService;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 수익 예측 API 컨트롤러
 * 프론트엔드 요청을 AI 서버로 프록시하고, 결과를 DB에 저장합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/revenue")
public class RevenuePredictionController {

    private final RestClient aiRestClient;
    private final RecommendPricePort recommendPricePort;
    private final RevenueCultivationLookup revenueCultivationLookup;
    private final FarmRevenuePredictionService farmRevenuePredictionService;
    private final ObjectMapper objectMapper;

    public RevenuePredictionController(
            @Qualifier("aiRestClient") RestClient aiRestClient,
            RecommendPricePort recommendPricePort,
            RevenueCultivationLookup revenueCultivationLookup,
            FarmRevenuePredictionService farmRevenuePredictionService,
            ObjectMapper objectMapper) {
        this.aiRestClient = aiRestClient;
        this.recommendPricePort = recommendPricePort;
        this.revenueCultivationLookup = revenueCultivationLookup;
        this.farmRevenuePredictionService = farmRevenuePredictionService;
        this.objectMapper = objectMapper;
    }

    /**
     * 농장에 저장된 작물별 수익 예측 스냅샷 목록 (LLM 호출 없음)
     */
    @GetMapping("/farms/{farmId}/predictions")
    public ApiResponse<List<Map<String, Object>>> listPredictions(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long farmId) {
        log.info("수익 예측 이력 조회: userId={}, farmId={}", userId, farmId);
        return ApiResponse.ok(farmRevenuePredictionService.listByFarm(userId, farmId));
    }

    @PostMapping("/predict")
    public ResponseEntity<ApiResponse<Map<String, Object>>> predictRevenue(
            @AuthenticationPrincipal Long userId,
            @RequestBody Map<String, Object> request) {

        String cropName = (String) request.get("crop_name");
        log.info("수익 예측 요청: userId={}, crop={}", userId, cropName);

        try {
            if (cropName != null) {
                KamisCropNameResolver.ResolveResult resolved = KamisCropNameResolver.resolve(cropName);
                if (resolved.standardName() != null) {
                    request.put("resolved_kamis_crop", resolved.standardName());
                }
                if (resolved.mappingNote() != null) {
                    request.put("mapping_note", resolved.mappingNote());
                }

                Integer price = recommendPricePort.getRecentPricePerKg(cropName);
                if (price != null) {
                    Map<String, Object> kamisData = new HashMap<>();
                    kamisData.put("price", price);
                    kamisData.put("unit", "1kg");
                    kamisData.put("date", LocalDate.now().toString());
                    kamisData.put("crop_name", cropName);
                    if (resolved.standardName() != null) {
                        kamisData.put("resolved_crop_name", resolved.standardName());
                    }
                    if (resolved.mappingNote() != null) {
                        kamisData.put("mapping_note", resolved.mappingNote());
                    }
                    request.put("kamis_price", kamisData);
                    log.info("캐시된 KAMIS 가격 적용: {} → {}원", cropName, price);
                }
            }

            enrichSowingMonth(request);

            ResponseEntity<String> responseEntity = aiRestClient.post()
                    .uri("/api/revenue/predict")
                    .body(request)
                    .retrieve()
                    .toEntity(String.class);

            String rawBody = responseEntity.getBody();
            log.info("AI 서버 응답 수신 성공");

            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = objectMapper.readValue(rawBody, Map.class);

            Long farmId = parseFarmId(request.get("farm_id"));
            if (farmId != null) {
                farmRevenuePredictionService.savePrediction(userId, farmId, request, aiResponse);
            }

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

    private Long parseFarmId(Object farmIdObj) {
        if (farmIdObj == null) {
            return null;
        }
        if (farmIdObj instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(farmIdObj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void enrichSowingMonth(Map<String, Object> request) {
        if (request.get("sowing_month") != null) {
            return;
        }
        Object farmIdObj = request.get("farm_id");
        String cropName = (String) request.get("crop_name");
        if (farmIdObj == null || cropName == null) {
            return;
        }
        long farmId;
        if (farmIdObj instanceof Number n) {
            farmId = n.longValue();
        } else {
            try {
                farmId = Long.parseLong(farmIdObj.toString());
            } catch (NumberFormatException e) {
                return;
            }
        }
        Optional<LocalDate> sowingDate = revenueCultivationLookup.findSowingDate(farmId, cropName);
        sowingDate.ifPresent(date -> request.put("sowing_month", date.getMonthValue()));
    }
}
