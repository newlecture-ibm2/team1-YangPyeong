package com.farmbalance.user.application.service;

import com.farmbalance.global.email.EmailService;
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

import java.security.SecureRandom;

/**
 * 비밀번호 재설정 서비스
 *
 * 보안질문 검증 후 임시 비밀번호를 생성하여 이메일로 발송합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PasswordResetService implements PasswordResetUseCase {

    private final UserRepository userRepository;
    private final SecurityQuestionRepository securityQuestionRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /** 임시 비밀번호 문자풀 */
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*";
    private static final String ALL = UPPER + LOWER + DIGITS + SPECIAL;
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

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
    public boolean verifyAnswer(String email, String securityAnswer) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        SecurityQuestion sq = securityQuestionRepository.findByUserId(user.getId()).orElse(null);
        if (sq == null) return false;

        String normalizedInput = securityAnswer.trim().toLowerCase();
        return passwordEncoder.matches(normalizedInput, sq.getAnswer());
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public void sendTemporaryPassword(String email, String securityAnswer) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.SECURITY_ANSWER_MISMATCH,
                        "보안질문 답변이 일치하지 않습니다."));

        // 2. 소셜 로그인 사용자는 비밀번호 재설정 불가
        if (user.getPassword() == null) {
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED,
                    "소셜 로그인 계정은 비밀번호 재설정을 할 수 없습니다. 소셜 로그인을 이용해주세요.");
        }

        // 3. 보안질문 답변 검증
        SecurityQuestion sq = securityQuestionRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SECURITY_QUESTION_NOT_FOUND));

        String normalizedInput = securityAnswer.trim().toLowerCase();
        if (!passwordEncoder.matches(normalizedInput, sq.getAnswer())) {
            throw new BusinessException(ErrorCode.SECURITY_ANSWER_MISMATCH);
        }

        // 4. 임시 비밀번호 생성
        String tempPassword = generateTempPassword();

        // 5. 비밀번호 암호화 후 저장 (이메일 실패와 무관하게 DB에 커밋됨)
        User updatedUser = user.withPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(updatedUser);

        // 6. 이메일 발송 (실패해도 비밀번호 변경은 롤백되지 않음)
        try {
            String htmlContent = buildEmailContent(user.getName(), tempPassword);
            emailService.sendSync(email, "[FarmBalance] 임시 비밀번호 안내", htmlContent);
            log.info("임시 비밀번호 발송 완료: email={}", email);
        } catch (Exception e) {
            log.error("임시 비밀번호 이메일 발송 실패 (비밀번호는 이미 변경됨): email={}", email, e);
            // 비밀번호는 이미 저장되었으므로 롤백하지 않음 — 프론트에서 재발송 유도
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "임시 비밀번호가 변경되었지만 이메일 발송에 실패했습니다. 재발송을 시도해주세요.");
        }
    }

    /** 안전한 임시 비밀번호 생성 (영문 대/소문자 + 숫자 + 특수문자 조합 보장) */
    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);

        // 각 문자 유형 최소 1개 보장
        sb.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        sb.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        sb.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        sb.append(SPECIAL.charAt(RANDOM.nextInt(SPECIAL.length())));

        // 나머지 랜덤 채우기
        for (int i = 4; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }

        // 셔플 (패턴 예측 방지)
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }

        return new String(chars);
    }

    /** 이메일 HTML 본문 생성 */
    private String buildEmailContent(String userName, String tempPassword) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "회원";

        return """
            <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
              <div style="background:linear-gradient(135deg,#2D6A4F,#40916C);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#fff;font-size:22px;margin:0;">🌱 FarmBalance</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">임시 비밀번호 안내</p>
              </div>
              <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;">
                <p style="font-size:15px;color:#333;margin:0 0 16px;">
                  안녕하세요, <strong>%s</strong>님!<br/>
                  요청하신 임시 비밀번호가 발급되었습니다.
                </p>
                <div style="background:#F0FFF4;border:2px dashed #40916C;border-radius:8px;padding:20px;text-align:center;margin:0 0 16px;">
                  <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">임시 비밀번호</p>
                  <p style="font-size:24px;font-weight:700;color:#2D6A4F;letter-spacing:2px;margin:0;font-family:monospace;">%s</p>
                </div>
                <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">
                  ⚠️ 로그인 후 반드시 <strong>마이페이지 → 비밀번호 변경</strong>에서 새 비밀번호로 변경해주세요.
                </p>
                <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">
                  본 메일을 요청하지 않으셨다면 무시하셔도 됩니다.<br/>
                  문의: support@farmbalance.com
                </p>
              </div>
              <div style="background:#f9fafb;padding:16px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
                <p style="font-size:11px;color:#9ca3af;margin:0;">© 2026 FarmBalance. All rights reserved.</p>
              </div>
            </div>
            """.formatted(displayName, tempPassword);
    }
}
