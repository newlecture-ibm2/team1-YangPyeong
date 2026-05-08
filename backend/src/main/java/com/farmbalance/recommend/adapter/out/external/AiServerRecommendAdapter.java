package com.farmbalance.recommend.adapter.out.external;

import com.farmbalance.recommend.application.port.out.RecommendAiPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 파이썬 AI 서버로 추천/진단 요청을 위임하는 어댑터
 */
@Slf4j
@Component
public class AiServerRecommendAdapter implements RecommendAiPort {

    private final RestTemplate restTemplate;

    public AiServerRecommendAdapter(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;

    @Override
    public String generateReason(String farmDetails, String cropName, String cropCategory) {
        String url = aiServerUrl + "/api/v1/recommend/reason";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("farm_details", farmDetails);
        requestBody.put("crop_name", cropName);
        requestBody.put("crop_category", cropCategory);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

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

    @Override
    public String diagnoseImage(MultipartFile image) {
        String url = aiServerUrl + "/api/v1/recommend/diagnose";

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
}
