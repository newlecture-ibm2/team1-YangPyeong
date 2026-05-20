package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.application.service.FarmCropDetailedGuideService;
import com.farmbalance.recommend.application.support.CropGuideCacheKey;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class CropDetailedGuideHandler {

    private final FarmCropDetailedGuideService farmCropDetailedGuideService;
    private final RestClient aiRestClient;
    private final ObjectMapper objectMapper;

    public CropDetailedGuideHandler(
            FarmCropDetailedGuideService farmCropDetailedGuideService,
            @Qualifier("aiRestClient") RestClient aiRestClient,
            ObjectMapper objectMapper) {
        this.farmCropDetailedGuideService = farmCropDetailedGuideService;
        this.aiRestClient = aiRestClient;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> getCached(
            Long userId,
            Long farmId,
            Long cropId,
            Map<String, Object> requestHints) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("UNAUTHORIZED", "로그인이 필요합니다."));
        }
        log.info("재배 가이드 캐시 조회: userId={}, farmId={}, cropId={}", userId, farmId, cropId);
        Optional<Map<String, Object>> cached =
                farmCropDetailedGuideService.getCached(userId, farmId, cropId, requestHints);
        return ResponseEntity.ok(ApiResponse.ok(cached.orElse(null)));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(
            Long userId,
            Long farmId,
            Long cropId,
            Map<String, Object> request) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("UNAUTHORIZED", "로그인이 필요합니다."));
        }

        request.put("crop_id", cropId);
        request.put("farm_id", farmId);

        log.info("재배 가이드 AI 생성: userId={}, farmId={}, cropId={}, crop={}",
                userId, farmId, cropId, request.get("crop_name"));

        try {
            farmCropDetailedGuideService.enrichRequestForAi(farmId, cropId, request);

            ResponseEntity<String> responseEntity = aiRestClient.post()
                    .uri("/api/recommend/crop-guide/generate")
                    .body(request)
                    .retrieve()
                    .toEntity(String.class);

            String body = responseEntity.getBody();
            if (body == null || body.isBlank()) {
                return ResponseEntity.internalServerError()
                        .body(ApiResponse.fail("GUIDE_AI_ERROR", "AI 서버 응답이 비어 있습니다."));
            }

            Map<String, Object> aiResponse = objectMapper.readValue(
                    body, new TypeReference<Map<String, Object>>() {});

            Map<String, Object> saved =
                    farmCropDetailedGuideService.saveFromAi(userId, farmId, cropId, request, aiResponse);
            return ResponseEntity.ok(ApiResponse.ok(saved));

        } catch (IllegalArgumentException e) {
            log.warn("재배 가이드 품질 검증 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("GUIDE_INVALID", e.getMessage()));
        } catch (RestClientResponseException e) {
            log.error("AI 서버 HTTP 에러: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail("GUIDE_AI_ERROR", "AI 서버가 오류를 반환했습니다: " + e.getStatusCode()));
        } catch (Exception e) {
            log.error("재배 가이드 생성 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail("GUIDE_ERROR", "재배 가이드 생성 중 오류: " + e.getMessage()));
        }
    }

    public static Map<String, Object> buildRequestHints(
            String experienceLevel,
            String adviceType,
            String recommendMode) {
        Map<String, Object> hints = new LinkedHashMap<>();
        hints.put("experience_level", CropGuideCacheKey.normalizeExperience(experienceLevel));
        if (adviceType != null && !adviceType.isBlank()) {
            hints.put("advice_type", adviceType.trim());
        }
        if (recommendMode != null && !recommendMode.isBlank()) {
            hints.put("recommend_mode", recommendMode.trim());
        }
        return hints;
    }
}
