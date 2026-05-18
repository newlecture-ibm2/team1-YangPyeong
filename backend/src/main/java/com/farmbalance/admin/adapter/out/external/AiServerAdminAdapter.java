package com.farmbalance.admin.adapter.out.external;

import com.farmbalance.admin.application.port.out.AdminAiPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class AiServerAdminAdapter implements AdminAiPort {

    private final RestTemplate restTemplate;

    @Value("${ai.server.url:http://ai-server:8000}")
    private String aiServerUrl;

    public AiServerAdminAdapter(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }
    
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Override
    public List<ShopAuditResultDto> auditShopBatch(List<ShopAuditItemDto> items) {
        if (items.isEmpty()) return Collections.emptyList();
        
        String url = aiServerUrl + "/api/admin/audit-shop-batch";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        try {
            ShopAuditBatchRequestDto requestBody = new ShopAuditBatchRequestDto(items);
            String jsonStr = objectMapper.writeValueAsString(requestBody);
            log.info("Sending Shop Audit Request: {}", jsonStr);
            
            HttpEntity<String> entity = new HttpEntity<>(jsonStr, headers);
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
        
        try {
            ModerationBatchRequestDto requestBody = new ModerationBatchRequestDto(items);
            String jsonStr = objectMapper.writeValueAsString(requestBody);
            log.info("Sending Moderation Request: {}", jsonStr);
            
            HttpEntity<String> entity = new HttpEntity<>(jsonStr, headers);
            ResponseEntity<ModerationBatchResponse> response = restTemplate.postForEntity(url, entity, ModerationBatchResponse.class);
            if (response.getBody() != null && response.getBody().results() != null) {
                return response.getBody().results();
            }
        } catch (Exception e) {
            log.error("AI Server Moderation Error: ", e);
        }
        return Collections.emptyList();
    }

    public record ShopAuditBatchRequestDto(List<ShopAuditItemDto> items) {}
    public record ShopAuditBatchResponse(List<ShopAuditResultDto> results) {}

    public record ModerationBatchRequestDto(List<ModerationItemDto> items) {}
    public record ModerationBatchResponse(List<ModerationResultDto> results) {}
}
