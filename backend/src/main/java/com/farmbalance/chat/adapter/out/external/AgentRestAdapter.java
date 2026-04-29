package com.farmbalance.chat.adapter.out.external;

import com.farmbalance.chat.application.port.out.AgentRouterPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentRestAdapter implements AgentRouterPort {

    // AiClientConfig에서 설정한 60초 타임아웃의 RestClient를 주입받음
    private final RestClient agentRestClient;

    @Override
    public String routeToAgent(String category, String message) {
        log.info("Agent 서버로 메시지 전송 [카테고리: {}] : {}", category, message);
        
        // 파이썬 서버로 보낼 JSON Body
        Map<String, String> requestBody = Map.of(
            "category", category,
            "message", message
        );

        try {
            // 파이썬 서버 응답이 {"reply": "..."} 형태라고 가정 (응답 파서 구현)
            @SuppressWarnings("unchecked")
            Map<String, String> response = agentRestClient.post()
                    .uri("/api/chat") // 파이썬팀과 맞춘 공통 엔드포인트 가정
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("reply")) {
                return response.get("reply");
            }
            return "AI 서버가 올바른 응답을 주지 않았습니다.";
        } catch (Exception e) {
            log.error("AI 서버 통신 실패: {}", e.getMessage());
            return "현재 AI 서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.";
        }
    }
}
