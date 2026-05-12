package com.farmbalance.notification.application.service;

import com.farmbalance.notification.application.port.in.FcmTokenUseCase;
import com.farmbalance.notification.application.port.out.FcmTokenPort;
import com.farmbalance.notification.domain.FcmToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FcmTokenService implements FcmTokenUseCase {

    private final FcmTokenPort fcmTokenPort;

    @Override
    public void registerToken(Long userId, String token, String deviceType) {
        fcmTokenPort.findByUserIdAndToken(userId, token)
                .ifPresentOrElse(
                        existingToken -> {
                            // 이미 존재하는 토큰의 경우 updatedAt 갱신 목적
                            fcmTokenPort.updateTimestamp(existingToken.getId());
                        },
                        () -> {
                            FcmToken newToken = FcmToken.create(userId, token, deviceType);
                            fcmTokenPort.save(newToken);
                        }
                );
    }

    @Override
    public void deleteToken(Long userId, String token) {
        fcmTokenPort.deleteByUserIdAndToken(userId, token);
    }
}
