package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.in.*;
import com.farmbalance.user.application.port.out.SecurityQuestionRepository;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.SecurityQuestion;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 비밀번호 재설정 서비스 — UseCase 구현체 (Application Layer)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PasswordResetService implements PasswordResetUseCase {

    private final UserRepository userRepository;
    private final SecurityQuestionRepository securityQuestionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public SecurityQuestionResponse getSecurityQuestion(SecurityQuestionVerifyRequest request) {
        // 이메일 열거 공격 방지: 이메일 미존재/보안질문 미등록 모두 동일한 에러 메시지 반환
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            throw new BusinessException(ErrorCode.SECURITY_QUESTION_NOT_FOUND,
                    "해당 이메일로 등록된 보안질문을 찾을 수 없습니다.");
        }

        SecurityQuestion sq = securityQuestionRepository.findByUserId(user.getId()).orElse(null);

        if (sq == null) {
            throw new BusinessException(ErrorCode.SECURITY_QUESTION_NOT_FOUND,
                    "해당 이메일로 등록된 보안질문을 찾을 수 없습니다.");
        }

        return new SecurityQuestionResponse(sq.getQuestion());
    }

    @Override
    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        // 1. 사용자 조회 (이메일 열거 공격 방지: 미등록 시에도 동일한 에러 반환)
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            throw new BusinessException(ErrorCode.SECURITY_ANSWER_MISMATCH,
                    "보안질문 답변이 일치하지 않습니다.");
        }

        // 2. 소셜 로그인 사용자는 비밀번호 재설정 불가
        if (user.getPassword() == null) {
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED,
                    "소셜 로그인 계정은 비밀번호 재설정을 할 수 없습니다. 소셜 로그인을 이용해주세요.");
        }

        // 3. 보안질문 조회
        SecurityQuestion sq = securityQuestionRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SECURITY_QUESTION_NOT_FOUND));

        // 4. 보안질문 답변 검증 (대소문자 무시, 공백 제거 후 비교)
        String normalizedInput = request.getSecurityAnswer().trim().toLowerCase();
        if (!passwordEncoder.matches(normalizedInput, sq.getAnswer())) {
            throw new BusinessException(ErrorCode.SECURITY_ANSWER_MISMATCH);
        }

        // 5. 새 비밀번호 암호화 및 저장
        User updatedUser = user.withPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(updatedUser);
        log.info("비밀번호 재설정 완료: userId={}, email={}", user.getId(), user.getEmail());
    }
}
