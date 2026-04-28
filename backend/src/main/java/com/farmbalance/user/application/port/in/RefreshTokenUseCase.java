package com.farmbalance.user.application.port.in;

import com.farmbalance.user.adapter.in.web.dto.RefreshRequest;
import com.farmbalance.user.adapter.in.web.dto.TokenResponse;

/**
 * 토큰 갱신 Input Port
 */
public interface RefreshTokenUseCase {
    TokenResponse refresh(RefreshRequest request);
}
