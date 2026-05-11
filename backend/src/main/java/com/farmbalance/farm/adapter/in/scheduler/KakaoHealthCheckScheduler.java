package com.farmbalance.farm.adapter.in.scheduler;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.SyncTriggerEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Slf4j
@Component
public class KakaoHealthCheckScheduler {

    private final RestTemplate restTemplate;
    private final String kakaoRestApiKey;
    private final ManageApiSyncUseCase manageApiSyncUseCase;
    private final ApplicationEventPublisher eventPublisher;
    private static final String API_NAME = "KAKAO_LOCAL";

    public KakaoHealthCheckScheduler(
            @Value("${external.kakao.rest-api-key:}") String kakaoRestApiKey,
            ManageApiSyncUseCase manageApiSyncUseCase,
            ApplicationEventPublisher eventPublisher) {
        this.restTemplate = new RestTemplate();
        this.kakaoRestApiKey = kakaoRestApiKey;
        this.manageApiSyncUseCase = manageApiSyncUseCase;
        this.eventPublisher = eventPublisher;
    }

    // 매 1시간마다 헬스체크 실행 (매시 15분)
    @Scheduled(cron = "0 15 * * * *")
    public void scheduledHealthCheck() {
        checkHealth();
    }

    @Async
    @EventListener
    public void onSyncTriggerEvent(SyncTriggerEvent event) {
        if (!API_NAME.equals(event.apiName())) {
            return;
        }
        log.info("[KakaoHealthCheck] 수동 헬스체크 지시 수신");
        checkHealth();
    }

    private void checkHealth() {
        try {
            ApiSyncStatus status = manageApiSyncUseCase.getApiSyncStatusByName(API_NAME);
            if (status != null && !status.getIsActive()) {
                log.info("[KakaoHealthCheck] API가 비활성화되어 있어 헬스체크를 건너뜁니다.");
                return;
            }
        } catch (Exception e) {
            log.warn("[KakaoHealthCheck] API 상태 조회 실패. (기본 동작 수행)");
        }

        if (kakaoRestApiKey == null || kakaoRestApiKey.isBlank()) {
            log.error("[KakaoHealthCheck] API 키가 설정되지 않았습니다.");
            eventPublisher.publishEvent(new ApiSyncEvent(API_NAME, "FAILED", 0, "API KEY MISSING"));
            return;
        }

        try {
            URI uri = UriComponentsBuilder
                    .fromUriString("https://dapi.kakao.com/v2/local/search/address")
                    .queryParam("query", "양평군")
                    .build().encode().toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                eventPublisher.publishEvent(new ApiSyncEvent(API_NAME, "SUCCESS", 0, null));
            } else {
                throw new RuntimeException("HTTP 응답 코드: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[KakaoHealthCheck] 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent(API_NAME, "FAILED", 0, e.getMessage()));
        }
    }
}
