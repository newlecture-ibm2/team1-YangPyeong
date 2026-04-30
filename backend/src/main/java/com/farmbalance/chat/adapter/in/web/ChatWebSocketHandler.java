package com.farmbalance.chat.adapter.in.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmbalance.chat.adapter.in.web.dto.ChatRequest;
import com.farmbalance.chat.adapter.in.web.dto.ChatResponse;
import com.farmbalance.chat.application.port.in.ChatProcessResult;
import com.farmbalance.chat.application.port.in.ChatUseCase;
import com.farmbalance.global.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 프론트엔드와 실시간 메시지를 주고받는 웹소켓 핸들러
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatUseCase chatUseCase;
    private final ObjectMapper objectMapper;
    private final JwtTokenProvider jwtTokenProvider;

    // 현재 접속 중인 세션들을 관리하는 맵 (스레드 안전)
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("새로운 웹소켓 연결 시도: sessionId={}", session.getId());
        try {
            // URI 쿼리 파라미터에서 토큰 추출 (예: ws://localhost:8080/ws/chat?token=eyJhbGci...)
            if (session.getUri() != null) {
                String token = UriComponentsBuilder.fromUri(session.getUri())
                        .build().getQueryParams().getFirst("token");
                
                if (token != null && !token.isEmpty()) {
                    Claims claims = jwtTokenProvider.validateAndGetClaims(token);
                    Long userId = jwtTokenProvider.getUserId(claims);
                    session.getAttributes().put("userId", userId);
                    log.info("웹소켓 인증 성공: userId={}", userId);
                } else {
                    log.warn("토큰이 전달되지 않았습니다. 권한 없는 접근일 수 있습니다.");
                }
            }
        } catch (Exception e) {
            log.error("웹소켓 연결 중 토큰 검증 실패: {}", e.getMessage());
        }
        
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String payload = message.getPayload();
        log.info("수신된 메시지: {}", payload);

        try {
            // 1. JSON 파싱
            ChatRequest request = objectMapper.readValue(payload, ChatRequest.class);
            
            // JWT 토큰으로부터 추출된 userId 가져오기
            Long userId = (Long) session.getAttributes().get("userId");
            if (userId == null) {
                throw new IllegalStateException("인증되지 않은 사용자입니다.");
            }

            // 2. 비즈니스 로직 처리 (마스킹 -> DB저장 -> 라우팅 -> 파이썬 서버 호출 -> AI응답 DB저장 -> 반환)
            ChatProcessResult result = chatUseCase.processUserMessage(
                userId, 
                request.getRoomId(), 
                request.getCategory(), 
                request.getMessage(),
                request.getMetadata()
            );

            // 3. 응답 전송 (JSON 포맷팅)
            String timestamp = java.time.LocalDateTime.now().toString();
            ChatResponse response = new ChatResponse(result.getRoomId(), "AI", result.getReply(), timestamp);
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            
        } catch (Exception e) {
            log.error("메시지 처리 실패: ", e);
            ChatResponse errorResponse = new ChatResponse(null, "SYSTEM", "시스템 오류가 발생했습니다.", java.time.LocalDateTime.now().toString());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorResponse)));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("웹소켓 연결 종료: sessionId={}, status={}", session.getId(), status);
        sessions.remove(session.getId());
    }
}
