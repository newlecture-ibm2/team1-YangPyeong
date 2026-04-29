package com.farmbalance.chat.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 프론트엔드가 웹소켓으로 보내는 JSON 메시지 규격
 */
@Getter
@NoArgsConstructor
public class ChatRequest {
    private Long roomId;
    private String category; // CROP, PRODUCT, POLICY, CONSULT 등
    private String message;
}
