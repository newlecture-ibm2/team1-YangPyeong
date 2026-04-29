package com.farmbalance.chat.application.service;

import com.farmbalance.chat.application.port.in.ChatUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService implements ChatUseCase {

    // 추후 의존성 주입받을 Port들
    // private final ChatRoomRepository chatRoomRepository;
    // private final ChatMessageRepository chatMessageRepository;
    // private final AgentRouterPort agentRouterPort;

    @Override
    @Transactional
    public void processUserMessage(Long userId, Long roomId, String message) {
        log.info("채팅 비즈니스 로직 시작 - userId: {}, message: {}", userId, message);
        
        // 1. 대화방(Session) 조회 또는 생성
        // 2. 유저 메시지를 DB에 저장 (ChatMessage)
        // 3. 메시지 의도 분석 및 라우팅 (AgentRouterPort 호출)
        // 4. 파이썬 Agent의 답변을 DB에 저장
        // 5. 프론트엔드(웹소켓)로 답변 전송
    }
}
