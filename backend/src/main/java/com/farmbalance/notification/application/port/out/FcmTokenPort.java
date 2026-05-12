package com.farmbalance.notification.application.port.out;

import com.farmbalance.notification.domain.FcmToken;

import java.util.List;
import java.util.Optional;

public interface FcmTokenPort {
    void save(FcmToken fcmToken);
    void updateTimestamp(Long id);
    void deleteByUserIdAndToken(Long userId, String token);
    Optional<FcmToken> findByUserIdAndToken(Long userId, String token);
    List<FcmToken> findByUserId(Long userId);
}
