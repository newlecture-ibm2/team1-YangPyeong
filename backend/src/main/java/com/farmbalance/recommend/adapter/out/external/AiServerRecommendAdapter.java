package com.farmbalance.recommend.adapter.out.external;

import com.farmbalance.recommend.application.port.out.RecommendAiPort;
import com.farmbalance.recommend.application.port.out.RecommendReasonCommand;
import com.farmbalance.recommend.domain.RecommendMode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.*;

/**
 * 파이썬 AI 서버로 추천/진단 요청을 위임하는 어댑터
 */
@Slf4j
@Component
public class AiServerRecommendAdapter implements RecommendAiPort {

    private final RestTemplate restTemplate;

    public AiServerRecommendAdapter(RestTemplateBuilder builder) {
        // SimpleClientHttpRequestFactory(HttpURLConnection)를 명시적으로 사용하여
        // JDK HttpClient의 HTTP/2 upgrade 헤더 전송을 방지합니다.
        // AI LLM 호출은 시간이 걸리므로 read timeout을 60초로 설정합니다.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(120));
        this.restTemplate = builder.requestFactory(() -> factory).build();
    }

    @Value("${ai.server-url:http://ai-server:8000}")
    private String aiServerUrl;

    @Override
    public String generateReason(RecommendReasonCommand command) {
        String url = aiServerUrl + "/api/recommend/reason";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("farm_details", command.farmDetails());
        requestBody.put("crop_name", command.cropName());
        requestBody.put("crop_category", command.cropCategory());
        requestBody.put("recommend_mode", command.recommendMode().name());
        requestBody.put("advice_type", command.adviceType().name());
        requestBody.put("is_current_crop", command.currentCrop());
        if (command.mismatchNote() != null) {
            requestBody.put("soil_mismatch", command.mismatchNote());
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, String> response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("ai_reason")) {
                return response.get("ai_reason");
            }
        } catch (Exception e) {
            log.error("AI 서버 통신 중 오류 발생 (사유 생성)", e);
        }
        return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    /**
     * 여러 작물의 추천 사유를 한 번의 AI 서버 호출로 일괄 생성합니다.
     * AI 서버의 /api/recommend/reason/batch 엔드포인트를 호출합니다.
     * 실패 시 인터페이스 기본 구현(개별 호출)으로 폴백합니다.
     */
    @Override
    public Map<String, String> generateBatchReasons(
            String farmDetails,
            RecommendMode mode,
            List<RecommendReasonCommand> commands
    ) {
        String url = aiServerUrl + "/api/recommend/reason/batch";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 배치 요청 본문 구성
        List<Map<String, Object>> items = new ArrayList<>();
        for (RecommendReasonCommand cmd : commands) {
            Map<String, Object> item = new HashMap<>();
            item.put("crop_name", cmd.cropName());
            item.put("crop_category", cmd.cropCategory());
            item.put("advice_type", cmd.adviceType().name());
            item.put("is_current_crop", cmd.currentCrop());
            if (cmd.mismatchNote() != null) {
                item.put("soil_mismatch", cmd.mismatchNote());
            }
            items.add(item);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("farm_details", farmDetails);
        requestBody.put("recommend_mode", mode.name());
        requestBody.put("items", items);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("reasons")) {
                Object reasonsObj = response.get("reasons");
                if (reasonsObj instanceof Map<?, ?> rawMap) {
                    Map<String, String> reasons = new LinkedHashMap<>();
                    for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                        if (entry.getKey() == null || entry.getValue() == null) {
                            continue;
                        }
                        String value = entry.getValue().toString().trim();
                        if (!value.isEmpty()) {
                            reasons.put(entry.getKey().toString(), value);
                        }
                    }
                    log.info("AI 배치 사유 생성 성공: {}건", reasons.size());
                    return reasons;
                }
            }
        } catch (Exception e) {
            log.warn("AI 배치 사유 생성 실패 (개별 폴백 생략, {}건): {}", commands.size(), e.getMessage());
        }

        return Collections.emptyMap();
    }

    @Override
    public String diagnoseImage(MultipartFile image) {
        String url = aiServerUrl + "/api/recommend/diagnose";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        try {
            // MultipartFile을 RestTemplate으로 전송하기 위한 ByteArrayResource 래퍼
            ByteArrayResource resource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename() != null ? image.getOriginalFilename() : "image.jpg";
                }
            };
            HttpHeaders imageHeaders = new HttpHeaders();
            String mimeType = image.getContentType();
            if (mimeType == null || mimeType.isEmpty()) {
                mimeType = "image/jpeg";
            }
            imageHeaders.setContentType(MediaType.parseMediaType(mimeType));

            HttpEntity<ByteArrayResource> imagePartEntity = new HttpEntity<>(resource, imageHeaders);
            body.add("image", imagePartEntity);
        } catch (Exception e) {
            log.error("이미지 읽기 실패", e);
            throw new RuntimeException("이미지 진단 요청 준비 중 오류가 발생했습니다.");
        }

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            Map<String, String> response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("diagnosis")) {
                return response.get("diagnosis");
            }
        } catch (Exception e) {
            log.error("AI 서버 통신 중 오류 발생 (이미지 진단)", e);
        }
        return "AI 서버 진단 중 오류가 발생했습니다.";
    }

    @Override
    public double[] tuneWeights(String farmDetails) {
        String url = aiServerUrl + "/api/recommend/weights";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("farm_details", farmDetails);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null) {
                double wSoil = Double.parseDouble(response.getOrDefault("w_soil", "0.35").toString());
                double wPrice = Double.parseDouble(response.getOrDefault("w_price", "0.25").toString());
                double wSupply = Double.parseDouble(response.getOrDefault("w_supply", "0.25").toString());
                double wDifficulty = Double.parseDouble(response.getOrDefault("w_difficulty", "0.15").toString());
                return new double[]{wSoil, wPrice, wSupply, wDifficulty};
            }
        } catch (Exception e) {
            log.error("AI 서버 통신 중 오류 발생 (가중치 튜닝)", e);
        }
        return new double[]{0.35, 0.25, 0.25, 0.15};
    }
}

