package com.farmbalance.user.application.port.in;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * 보안질문 조회 요청 DTO (이메일로 보안질문 가져오기)
 */
@Getter
public class SecurityQuestionVerifyRequest {

    @NotBlank(message = "이메일을 입력해주세요")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;
}
