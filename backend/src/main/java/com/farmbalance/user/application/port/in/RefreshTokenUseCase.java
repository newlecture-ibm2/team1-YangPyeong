package com.farmbalance.user.application.port.in;

/**
 * 토큰 갱신 Input Port
 */
public interface RefreshTokenUseCase {
    TokenResponse refresh(RefreshRequest request);
}
