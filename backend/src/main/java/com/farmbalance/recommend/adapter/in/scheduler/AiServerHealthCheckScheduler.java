package com.farmbalance.recommend.adapter.in.scheduler;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.SyncTriggerEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
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
    private final ManageApiSyncUseCase manageApiSyncUseCase;
    private final ApplicationEventPublisher eventPublisher;
    private static final String API_NAME = "AI_SERVER";

    public AiServerHealthCheckScheduler(
            @Value("${ai.server-url:http://localhost:8000}") String aiServerUrl,
            ManageApiSyncUseCase manageApiSyncUseCase,
            ApplicationEventPublisher eventPublisher) {
        this.restTemplate = new RestTemplate();
        this.aiServerUrl = aiServerUrl;
        this.manageApiSyncUseCase = manageApiSyncUseCase;
        this.eventPublisher = eventPublisher;
    }

    // 매 1시간마다 헬스체크 실행 (매시 45분)
    @Scheduled(cron = "0 45 * * * *")
    public void scheduledHealthCheck() {
        checkHealth();
    }

    @Async
    @EventListener
    public void onSyncTriggerEvent(SyncTriggerEvent event) {
        if (!API_NAME.equals(event.apiName())) {
            return;
        }
        log.info("[AiServerHealthCheck] 수동 헬스체크 지시 수신");
        checkHealth();
    }

    private void checkHealth() {
        try {
            ApiSyncStatus status = manageApiSyncUseCase.getApiSyncStatusByName(API_NAME);
            if (status != null && !status.getIsActive()) {
                log.info("[AiServerHealthCheck] API가 비활성화되어 있어 헬스체크를 건너뜁니다.");
                return;
            }
        } catch (Exception e) {
            log.warn("[AiServerHealthCheck] API 상태 조회 실패. (기본 동작 수행)");
        }

        try {
            // FastAPI 서버의 /docs 엔드포인트를 호출하여 서버가 켜져있는지 확인합니다.
            String url = aiServerUrl + "/docs";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                eventPublisher.publishEvent(new ApiSyncEvent(API_NAME, "SUCCESS", 0, null));
            } else {
                throw new RuntimeException("HTTP 응답 코드: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[AiServerHealthCheck] 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent(API_NAME, "FAILED", 0, e.getMessage()));
        }
    }
}
