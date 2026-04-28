package com.farmbalance.user.application.port.in;

/**
 * 소셜 로그인 Input Port
 */
public interface SocialLoginUseCase {
    TokenResponse socialLogin(SocialLoginRequest request);
}
