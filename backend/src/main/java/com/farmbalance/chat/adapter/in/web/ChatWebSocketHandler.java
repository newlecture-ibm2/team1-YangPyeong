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
import com.farmbalance.chat.application.port.in.ChatUseCase;
import lombok.RequiredArgsConstructor;

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

    // 현재 접속 중인 세션들을 관리하는 맵 (스레드 안전)
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("새로운 웹소켓 연결 성공: sessionId={}", session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String payload = message.getPayload();
        log.info("수신된 메시지: {}", payload);

        try {
            // 1. JSON 파싱
            ChatRequest request = objectMapper.readValue(payload, ChatRequest.class);
            
            // TODO: (지윤님 과제) JWT 필터 등에서 저장한 인증 정보로부터 실제 유저 ID 추출 로직 필요
            Long dummyUserId = 1L; 

            // 2. 비즈니스 로직 처리 (마스킹 -> 라우팅 -> 파이썬 서버 호출 -> 응답 파싱)
            String aiReply = chatUseCase.processUserMessage(
                dummyUserId, 
                request.getRoomId(), 
                request.getCategory(), 
                request.getMessage(),
                request.getMetadata()
            );

            // 3. 응답 전송 (JSON 포맷팅)
            // roomId가 null이었다면 새로운 방이 생성되었음을 프론트엔드에 알려주기 위해 할당된 ID를 보냄 (현재는 DB연결 전이므로 임시값)
            Long responseRoomId = request.getRoomId() != null ? request.getRoomId() : 999L;
            String timestamp = java.time.LocalDateTime.now().toString();
            
            ChatResponse response = new ChatResponse(responseRoomId, "AI", aiReply, timestamp);
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            
        } catch (Exception e) {
            log.error("메시지 처리 실패: ", e);
            ChatResponse errorResponse = new ChatResponse(null, "SYSTEM", "시스템 오류가 발생했습니다.", java.time.LocalDateTime.now().toString());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorResponse)));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("웹소켓 연결 종료: sessionId={}, status={}", session.getId(), status);
        sessions.remove(session.getId());
    }
}
