package com.farmbalance.user.application.port.in;

/**
 * 로그아웃 Input Port
 */
public interface LogoutUseCase {
    void logout(Long userId);
}
