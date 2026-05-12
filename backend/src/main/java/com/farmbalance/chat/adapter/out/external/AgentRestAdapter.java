package com.farmbalance.chat.adapter.out.external;

import com.farmbalance.chat.application.port.out.AgentRouterPort;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class AgentRestAdapter implements AgentRouterPort {

    private final RestClient agentRestClient;

    public AgentRestAdapter(@org.springframework.beans.factory.annotation.Qualifier("agentRestClient") RestClient agentRestClient) {
        this.agentRestClient = agentRestClient;
    }

    @Override
    @Retry(name = "aiRetry", fallbackMethod = "fallbackRouteToAgent") // Resilience4j 연동 (통신 실패시 재시도)
    public String routeToAgent(Long userId, Long roomId, String category, String message, Map<String, Object> metadata) {
        log.info("Agent 서버로 메시지 전송 [카테고리: {}] : {}", category, message);
        
        // 파이썬 서버로 보낼 JSON Body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userId", userId);
        requestBody.put("roomId", roomId);
        requestBody.put("category", category);
        requestBody.put("message", message);
        if (metadata != null) {
            requestBody.put("metadata", metadata);
        }

        try {
            // 파이썬 서버 응답이 {"reply": "..."} 형태라고 가정 (응답 파서 구현)
            @SuppressWarnings("unchecked")
            Map<String, String> response = agentRestClient.post()
                    .uri("/api/chat") // 파이썬팀과 맞춘 공통 엔드포인트 가정
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("reply")) {
                return String.valueOf(response.get("reply"));
            }
            return "AI 서버가 올바른 응답을 주지 않았습니다.";
        } catch (Exception e) {
            log.error("AI 서버 통신 실패 (재시도 중): {}", e.getMessage());
            throw e; // Retry 로직을 태우기 위해 에러를 밖으로 던짐
        }
    }

    // 통신 3회 실패 시 최종적으로 호출되는 폴백 메서드 (에러 숨김 및 우회)
    public String fallbackRouteToAgent(Long userId, Long roomId, String category, String message, Map<String, Object> metadata, Exception ex) {
        log.error("AI 서버 통신 최종 실패 (Fallback 실행): {}", ex.getMessage());
        return "현재 AI 챗봇 서버에 일시적인 장애가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
}
