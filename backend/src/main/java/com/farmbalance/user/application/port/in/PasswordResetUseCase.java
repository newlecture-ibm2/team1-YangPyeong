package com.farmbalance.user.application.port.in;

/**
 * 비밀번호 재설정 UseCase (Input Port)
 */
public interface PasswordResetUseCase {

    /** 이메일로 보안질문 조회 */
    SecurityQuestionResponse getSecurityQuestion(SecurityQuestionVerifyRequest request);

    /** 보안질문 답변 검증 + 비밀번호 재설정 */
    void resetPassword(PasswordResetRequest request);
}
