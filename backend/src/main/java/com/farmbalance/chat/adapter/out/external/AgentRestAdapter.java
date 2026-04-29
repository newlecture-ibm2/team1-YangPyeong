package com.farmbalance.chat.adapter.out.external;

import com.farmbalance.chat.application.port.out.AgentRouterPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentRestAdapter implements AgentRouterPort {

    // AiClientConfig에서 설정한 60초 타임아웃의 RestClient를 주입받음
    private final RestClient agentRestClient;

    @Override
    public String routeToAgent(String message) {
        log.info("Agent 서버로 메시지 전송: {}", message);
        
        // TODO: (지윤님 구현 파트)
        // agentRestClient를 이용해 POST 요청을 보내고 결과를 리턴하는 로직 작성
        // 예: return agentRestClient.post().uri("/chat").body(...).retrieve().body(String.class);
        
        return "파이썬 에이전트의 답변입니다. (임시)";
    }
}
