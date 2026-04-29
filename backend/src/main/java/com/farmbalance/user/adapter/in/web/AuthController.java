package com.farmbalance.user.adapter.in.web;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.user.application.port.in.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 컨트롤러 (Driving Adapter)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final SignUpUseCase signUpUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final SocialLoginUseCase socialLoginUseCase;
    private final PasswordResetUseCase passwordResetUseCase;

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(loginUseCase.login(request));
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SignUpResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return ApiResponse.ok(signUpUseCase.signUp(request));
    }

    @PostMapping("/social-login")
    public ApiResponse<TokenResponse> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
        return ApiResponse.ok(socialLoginUseCase.socialLogin(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(refreshTokenUseCase.refresh(request));
    }

    /**
     * 로그아웃 — 토큰이 없어도 에러 없이 정상 응답 (멱등성 보장).
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        try {
            Long userId = SecurityUtil.getCurrentUserId();
            logoutUseCase.logout(userId);
        } catch (BusinessException e) {
            log.debug("로그아웃 요청 시 인증 정보 없음 (이미 로그아웃 상태)");
        }
        return ApiResponse.ok(null);
    }

    /**
     * 보안질문 조회 — 이메일로 등록된 보안질문을 반환합니다.
     */
    @PostMapping("/password-reset/question")
    public ApiResponse<SecurityQuestionResponse> getSecurityQuestion(
            @Valid @RequestBody SecurityQuestionVerifyRequest request) {
        return ApiResponse.ok(passwordResetUseCase.getSecurityQuestion(request));
    }

    /**
     * 비밀번호 재설정 — 보안질문 답변 검증 후 비밀번호를 변경합니다.
     */
    @PutMapping("/password-reset")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetUseCase.resetPassword(request);
        return ApiResponse.ok(null);
    }
}
