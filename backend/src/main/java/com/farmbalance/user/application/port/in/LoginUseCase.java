package com.farmbalance.user.application.port.in;

import com.farmbalance.user.adapter.in.web.dto.LoginRequest;
import com.farmbalance.user.adapter.in.web.dto.TokenResponse;

/**
 * 로그인 Input Port
 */
public interface LoginUseCase {
    TokenResponse login(LoginRequest request);
}
