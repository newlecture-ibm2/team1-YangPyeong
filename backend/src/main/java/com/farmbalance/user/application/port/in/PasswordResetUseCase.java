package com.farmbalance.user.application.port.in;

/**
 * 비밀번호 재설정 UseCase (Input Port)
 *
 * 보안질문 검증 후 임시 비밀번호를 생성하여 이메일로 발송합니다.
 */
public interface PasswordResetUseCase {

    /** 이메일로 보안질문 조회 */
    SecurityQuestionResponse getSecurityQuestion(SecurityQuestionVerifyRequest request);

    /** 보안질문 답변 검증 (답변만 확인, 비밀번호 변경 없음) */
    boolean verifyAnswer(String email, String securityAnswer);

    /** 보안질문 답변 검증 + 임시 비밀번호 생성 + 이메일 발송 */
    void sendTemporaryPassword(String email, String securityAnswer);
}
