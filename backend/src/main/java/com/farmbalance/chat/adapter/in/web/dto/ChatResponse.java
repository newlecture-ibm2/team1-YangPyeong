package com.farmbalance.chat.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 백엔드가 프론트엔드로 보내는 웹소켓 응답 JSON 규격
 */
@Getter
@AllArgsConstructor
public class ChatResponse {
    private Long roomId; // 생성된 방 번호를 프론트가 알 수 있도록 반환
    private String sender; // AI, SYSTEM
    private String message;
    private String timestamp;
}
