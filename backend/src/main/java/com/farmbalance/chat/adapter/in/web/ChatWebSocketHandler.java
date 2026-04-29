package com.farmbalance.chat.adapter.in.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

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

        // TODO: (지윤님 과제) 
        // JWT 필터 등에서 저장한 인증 정보로부터 실제 유저 ID와 방 ID를 추출하는 로직 필요
        Long dummyUserId = 1L; 
        Long dummyRoomId = 1L; 

        // 1. 유저의 메시지를 비즈니스 로직(Service)으로 넘겨 처리
        chatUseCase.processUserMessage(dummyUserId, dummyRoomId, payload);

        // 임시 에코 메시지 (연결 테스트용)
        session.sendMessage(new TextMessage("백엔드 라우팅 및 수신 완료: " + payload));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("웹소켓 연결 종료: sessionId={}, status={}", session.getId(), status);
        sessions.remove(session.getId());
    }
}
