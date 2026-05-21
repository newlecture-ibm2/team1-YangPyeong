package com.farmbalance.notification.domain;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(force = true)
public class FcmToken {
    private final Long id;
    private final Long userId;
    private final String token;
    private final String deviceType;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static FcmToken create(Long userId, String token, String deviceType) {
        return FcmToken.builder()
                .userId(userId)
                .token(token)
                .deviceType(deviceType != null ? deviceType : "WEB")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
