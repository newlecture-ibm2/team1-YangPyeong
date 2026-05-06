package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyAiAnalyzePort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI 서버(FastAPI)에 정책 분석을 요청하는 Adapter.
 * POST {ai-server-url}/api/policy/analyze 호출.
 */
@Slf4j
@Component
public class PolicyAiAnalyzeClient implements PolicyAiAnalyzePort {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String aiServerUrl;

    public PolicyAiAnalyzeClient(
            @Value("${ai.server-url:http://localhost:8000}") String aiServerUrl) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.aiServerUrl = aiServerUrl;
    }

    @Override
    public Optional<AiAnalyzeResult> analyze(String source, String externalId,
                                              String rawJson, String text, String sourceUrl) {
        // ── 테스트용: MOCK_SKIP_ prefix는 AI 호출 없이 skip ──
        if (externalId != null && externalId.startsWith("MOCK_SKIP_")) {
            log.info("[AI분석] 강제 skip — externalId={}", externalId);
            return Optional.empty();
        }

        try {
            // 요청 바디 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("source", source);
            requestBody.put("external_id", externalId);
            requestBody.put("source_url", sourceUrl);

            if (rawJson != null && !rawJson.isBlank()) {
                requestBody.put("raw", objectMapper.readTree(rawJson));
            }
            if (text != null && !text.isBlank()) {
                requestBody.put("text", text);
            }

            // HTTP 요청
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(requestBody), headers);

            String url = aiServerUrl + "/api/policy/analyze";
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("[AI분석] HTTP 실패 — source={}, externalId={}, status={}",
                        source, externalId, response.getStatusCode());
                return Optional.empty();
            }

            // 응답 파싱
            JsonNode root = objectMapper.readTree(response.getBody());

            if (!"ok".equals(root.path("status").asText())) {
                String error = root.path("error").asText("알 수 없는 오류");
                log.warn("[AI분석] 분석 실패 — source={}, externalId={}, error={}",
                        source, externalId, error);
                return Optional.empty();
            }

            JsonNode result = root.path("result");
            if (result.isMissingNode()) {
                return Optional.empty();
            }

            // warnings 파싱
            List<String> warnings = new ArrayList<>();
            if (result.has("warnings")) {
                result.path("warnings").forEach(w -> warnings.add(w.asText()));
            }

            // normalizedJson = result 전체를 JSON 문자열로 보관
            String normalizedJson = objectMapper.writeValueAsString(result);

            return Optional.of(new AiAnalyzeResult(
                    result.path("title").asText(null),
                    result.path("organization").asText(null),
                    result.path("region_code").asText(null),
                    result.path("category").asText("기타"),
                    result.path("target").asText(null),
                    result.path("content_summary").asText(null),
                    result.path("support_amount").asText(null),
                    result.path("apply_start").asText(null),
                    result.path("apply_end").asText(null),
                    result.path("confidence").asDouble(0.5),
                    warnings,
                    normalizedJson
            ));

        } catch (Exception e) {
            log.error("[AI분석] 예외 발생 — source={}, externalId={}: {}",
                    source, externalId, e.getMessage());
            return Optional.empty();
        }
    }
}
