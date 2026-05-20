package com.farmbalance.admin.adapter.out.external;

import com.farmbalance.admin.application.port.out.AdminAiPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AiServerAdminAdapter implements AdminAiPort {

    private final RestTemplate restTemplate;

    @Value("${ai.server.url:http://ai-server:8000}")
    private String aiServerUrl;

    public AiServerAdminAdapter(RestTemplateBuilder builder) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.restTemplate = builder.requestFactory(() -> factory).build();
    }

    @Override
    public List<ShopAuditResultDto> auditShopBatch(List<ShopAuditItemDto> items) {
        if (items.isEmpty()) return Collections.emptyList();
        
        String url = aiServerUrl + "/api/admin/audit-shop-batch";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> requestBody = Map.of("items", items);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<ShopAuditBatchResponse> response = restTemplate.postForEntity(url, entity, ShopAuditBatchResponse.class);
            if (response.getBody() != null && response.getBody().results() != null) {
                return response.getBody().results();
            }
        } catch (Exception e) {
            log.error("AI Server Shop Audit Error: ", e);
        }
        return Collections.emptyList();
    }

    @Override
    public List<ModerationResultDto> moderatePostBatch(List<ModerationItemDto> items) {
        if (items.isEmpty()) return Collections.emptyList();
        
        String url = aiServerUrl + "/api/admin/moderate-post-batch";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> requestBody = Map.of("items", items);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<ModerationBatchResponse> response = restTemplate.postForEntity(url, entity, ModerationBatchResponse.class);
            if (response.getBody() != null && response.getBody().results() != null) {
                return response.getBody().results();
            }
        } catch (Exception e) {
            log.error("AI Server Moderation Error: ", e);
        }
        return Collections.emptyList();
    }

    record ShopAuditBatchResponse(List<ShopAuditResultDto> results) {}
    record ModerationBatchResponse(List<ModerationResultDto> results) {}
}
