package com.farmbalance.user.application.port.in;

/**
 * 로그인 Input Port
 */
public interface LoginUseCase {
    TokenResponse login(LoginRequest request);
}
