package com.farmbalance.admin.adapter.out.external;

import com.farmbalance.admin.application.port.out.AdminAiPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class AiServerAdminAdapter implements AdminAiPort {

    private final HttpClient httpClient;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Value("${ai.server.url:http://ai-server:8000}")
    private String aiServerUrl;

    public AiServerAdminAdapter(com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public List<ShopAuditResultDto> auditShopBatch(List<ShopAuditItemDto> items) {
        if (items.isEmpty()) return Collections.emptyList();
        
        String url = aiServerUrl + "/api/admin/audit-shop-batch";
        
        try {
            ShopAuditBatchRequestDto requestBody = new ShopAuditBatchRequestDto(items);
            String jsonStr = objectMapper.writeValueAsString(requestBody);
            log.info("Sending Shop Audit Request: {}", jsonStr);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonStr))
                    .build();
                    
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                ShopAuditBatchResponse res = objectMapper.readValue(response.body(), ShopAuditBatchResponse.class);
                if (res != null && res.results() != null) {
                    return res.results();
                }
            } else {
                log.error("AI Server Shop Audit returned status {}: {}", response.statusCode(), response.body());
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
        
        try {
            ModerationBatchRequestDto requestBody = new ModerationBatchRequestDto(items);
            String jsonStr = objectMapper.writeValueAsString(requestBody);
            log.info("Sending Moderation Request: {}", jsonStr);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonStr))
                    .build();
                    
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                ModerationBatchResponse res = objectMapper.readValue(response.body(), ModerationBatchResponse.class);
                if (res != null && res.results() != null) {
                    return res.results();
                }
            } else {
                log.error("AI Server Moderation returned status {}: {}", response.statusCode(), response.body());
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
