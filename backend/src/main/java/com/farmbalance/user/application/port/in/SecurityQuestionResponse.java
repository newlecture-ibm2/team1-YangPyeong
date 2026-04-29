package com.farmbalance.user.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 보안질문 응답 DTO (질문 텍스트만 반환)
 */
@Getter
@AllArgsConstructor
public class SecurityQuestionResponse {
    private String question;
}
