package com.farmbalance.notification.application.port.in;

public interface FcmTokenUseCase {
    void registerToken(Long userId, String token, String deviceType);
    void deleteToken(Long userId, String token);
}
