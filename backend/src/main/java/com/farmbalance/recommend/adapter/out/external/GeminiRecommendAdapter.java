package com.farmbalance.recommend.adapter.out.external;

import com.farmbalance.recommend.application.port.out.RecommendAiPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiRecommendAdapter implements RecommendAiPort {

    private final RestTemplate restTemplate;

    @Value("${ai.gemini.api-key:}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    @Override
    public String generateReason(String farmDetails, String cropName, String cropCategory) {
        if (apiKey == null || apiKey.isBlank()) {
            return "AI 추천 사유 생성이 비활성화되어 있습니다.";
        }

        String prompt = String.format(
            "다음 농장 정보를 바탕으로 '%s'(%s) 작물이 왜 추천되었는지 3문장 이내로 전문적이고 친절하게 설명해줘.\n농장 정보: %s",
            cropName, cropCategory, farmDetails
        );

        return callGeminiApi(prompt, null, null);
    }

    @Override
    public String diagnoseImage(MultipartFile image) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Gemini API Key가 설정되지 않아 이미지 진단을 수행할 수 없습니다.";
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType();
            String prompt = "이 작물 사진을 보고, 어떤 작물인지 그리고 어떤 병해충 증상이 있는지, 어떻게 조치해야 하는지 농업 전문가로서 진단해줘. 500자 이내로 답변해줘.";
            
            return callGeminiApi(prompt, base64Image, mimeType);
        } catch (Exception e) {
            log.error("이미지 인코딩 중 오류 발생", e);
            throw new RuntimeException("이미지 진단 중 오류가 발생했습니다.");
        }
    }

    private String callGeminiApi(String textPrompt, String base64Image, String mimeType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", textPrompt);

        List<Object> parts;
        if (base64Image != null && mimeType != null) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", mimeType);
            inlineData.put("data", base64Image);

            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("inline_data", inlineData);
            
            parts = List.of(textPart, imagePart);
        } else {
            parts = List.of(textPart);
        }

        Map<String, Object> content = new HashMap<>();
        content.put("parts", parts);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(GEMINI_API_URL + apiKey, entity, Map.class);
            return extractTextFromResponse(response);
        } catch (Exception e) {
            log.error("Gemini API 호출 중 오류 발생", e);
            return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }
        } catch (Exception e) {
            log.error("Gemini 응답 파싱 중 오류", e);
        }
        return "AI 응답을 해석할 수 없습니다.";
    }
}
