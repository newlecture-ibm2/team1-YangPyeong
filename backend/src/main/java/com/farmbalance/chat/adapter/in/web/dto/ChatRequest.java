package com.farmbalance.chat.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.Map;

/**
 * 프론트엔드가 웹소켓으로 보내는 JSON 메시지 규격
 */
@Getter
@NoArgsConstructor
public class ChatRequest {
    private Long roomId; // null일 경우 새로운 대화방 생성 요청
    private String category; // CROP, PRODUCT, POLICY, CONSULT 등
    private String message;
    private Map<String, Object> metadata; // 지역 정보, 필터 옵션 등 부가 정보 전달용
}
