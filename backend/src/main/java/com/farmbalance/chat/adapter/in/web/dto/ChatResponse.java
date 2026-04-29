package com.farmbalance.chat.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 백엔드가 프론트엔드로 보내는 웹소켓 응답 JSON 규격
 */
@Getter
@AllArgsConstructor
public class ChatResponse {
    private String sender; // AI, SYSTEM
    private String message;
}
