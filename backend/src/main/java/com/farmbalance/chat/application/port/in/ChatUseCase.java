package com.farmbalance.chat.application.port.in;

public interface ChatUseCase {
    /**
     * 유저의 메시지를 받아 적절한 Agent로 라우팅하고 응답을 반환합니다.
     * @param userId 메시지를 보낸 유저 ID
     * @param roomId 대화방 ID (없으면 생성)
     * @param category 대화 카테고리
     * @param message 유저가 입력한 메시지 내용
     * @param metadata 프론트가 보낸 추가 정보
     * @return Agent의 응답 메시지
     */
    String processUserMessage(Long userId, Long roomId, String category, String message, java.util.Map<String, Object> metadata);
}
