package com.farmbalance.chat.adapter.in.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 프론트엔드와 실시간 메시지를 주고받는 웹소켓 핸들러
 */
@Slf4j
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

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
        // 1. 유저의 메시지를 파싱하여 의도 분석
        // 2. 파이썬 Agent 서버로 RestClient를 이용해 질문 전송 (라우터 역할)
        // 3. 응답이 오면 다시 이 WebSocketSession을 통해 프론트로 TextMessage 전송

        // 임시 에코 메시지 (연결 테스트용)
        session.sendMessage(new TextMessage("백엔드 수신 완료: " + payload));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("웹소켓 연결 종료: sessionId={}, status={}", session.getId(), status);
        sessions.remove(session.getId());
    }
}
