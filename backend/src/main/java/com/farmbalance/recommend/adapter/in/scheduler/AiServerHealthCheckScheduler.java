package com.farmbalance.recommend.adapter.in.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
public class AiServerHealthCheckScheduler {

    private final RestTemplate restTemplate;
    private final String aiServerUrl;

    public AiServerHealthCheckScheduler(
            @Value("${ai.server-url:http://localhost:8000}") String aiServerUrl) {
        this.restTemplate = new RestTemplate();
        this.aiServerUrl = aiServerUrl;
    }

    // 매 1시간마다 헬스체크 실행 (매시 45분)
    @Scheduled(cron = "0 45 * * * *")
    public void scheduledHealthCheck() {
        checkHealth();
    }

    private void checkHealth() {
        try {
            // FastAPI 서버의 /docs 엔드포인트를 호출하여 서버가 켜져있는지 확인합니다.
            String url = aiServerUrl + "/docs";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[AiServerHealthCheck] AI 서버가 정상 동작 중입니다.");
            } else {
                throw new RuntimeException("HTTP 응답 코드: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[AiServerHealthCheck] AI 서버 헬스체크 실패: {}", e.getMessage());
        }
    }
}
