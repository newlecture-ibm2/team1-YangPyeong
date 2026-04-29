package com.farmbalance.global.config;

import com.farmbalance.chat.adapter.in.web.ChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * 챗봇 실시간 통신을 위한 WebSocket 설정
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 프론트엔드가 웹소켓 연결을 맺을 엔드포인트 URL 지정 (ex: ws://localhost:8080/ws/chat)
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOrigins("*"); // 개발 환경 편의를 위해 일단 모두 허용 (운영 시 변경 필요)
    }
}
