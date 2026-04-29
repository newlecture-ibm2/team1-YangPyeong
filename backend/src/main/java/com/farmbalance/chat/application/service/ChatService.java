package com.farmbalance.chat.application.service;

import com.farmbalance.chat.application.port.in.ChatUseCase;
import com.farmbalance.chat.application.port.out.AgentRouterPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService implements ChatUseCase {

    private final AgentRouterPort agentRouterPort;
    // private final ChatRoomRepository chatRoomRepository;
    // private final ChatMessageRepository chatMessageRepository;

    @Override
    @Transactional
    public String processUserMessage(Long userId, Long roomId, String category, String message, java.util.Map<String, Object> metadata) {
        log.info("채팅 비즈니스 로직 시작 - userId: {}, category: {}, roomId: {}", userId, category, roomId);
        
        // 1. 개인정보 마스킹 처리 (AI 응답 파서 + 개인정보 마스킹 기능)
        String maskedMessage = PiiMaskingUtils.mask(message);
        log.debug("마스킹 완료된 메시지: {}", maskedMessage);

        // 2. 대화방(Session) 조회 또는 생성 및 유저 메시지 DB 저장 (추후 JPA 구현)
        // ChatRoom room = chatRoomRepository.findById(roomId)...
        // ChatMessage userChat = new ChatMessage(room, SenderRole.USER, maskedMessage);
        // chatMessageRepository.save(userChat);

        // 3. 메시지 의도 분석(미리 지정된 category 사용) 및 라우팅 (AgentRouterPort 호출)
        String aiReply = agentRouterPort.routeToAgent(userId, roomId, category, maskedMessage, metadata);

        // 4. 파이썬 Agent의 답변을 DB에 저장 (추후 JPA 구현)
        // ChatMessage aiChat = new ChatMessage(room, SenderRole.AI, aiReply);
        // chatMessageRepository.save(aiChat);

        // 5. 프론트엔드(웹소켓)로 반환할 답변 리턴
        return aiReply;
    }
}
