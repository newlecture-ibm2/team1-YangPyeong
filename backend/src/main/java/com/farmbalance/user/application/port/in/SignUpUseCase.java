package com.farmbalance.user.application.port.in;

/**
 * 회원가입 Input Port
 */
public interface SignUpUseCase {
    SignUpResponse signUp(SignUpRequest request);
}
