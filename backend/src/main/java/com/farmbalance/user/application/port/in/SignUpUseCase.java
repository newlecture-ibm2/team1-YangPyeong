package com.farmbalance.user.application.port.in;

import com.farmbalance.user.adapter.in.web.dto.SignUpRequest;
import com.farmbalance.user.adapter.in.web.dto.SignUpResponse;

/**
 * 회원가입 Input Port
 */
public interface SignUpUseCase {
    SignUpResponse signUp(SignUpRequest request);
}
