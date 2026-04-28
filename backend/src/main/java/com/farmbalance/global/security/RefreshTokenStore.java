package com.farmbalance.global.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Redis 기반 Refresh Token 저장소.
 * Key: "refresh:{userId}", Value: refreshToken
 *
 * Redis 장애 시에도 서비스 전체가 다운되지 않도록
 * 모든 메서드에 try-catch를 적용합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenStore {

    private final StringRedisTemplate redisTemplate;

    private static final String PREFIX = "refresh:";

    public void save(Long userId, String refreshToken, long expirationMs) {
        try {
            redisTemplate.opsForValue().set(
                    PREFIX + userId,
                    refreshToken,
                    expirationMs,
                    TimeUnit.MILLISECONDS
            );
        } catch (Exception e) {
            log.warn("Redis 연결 실패 — Refresh Token 저장 생략: {}", e.getMessage());
        }
    }

    public Optional<String> find(Long userId) {
        try {
            String token = redisTemplate.opsForValue().get(PREFIX + userId);
            return Optional.ofNullable(token);
        } catch (Exception e) {
            log.warn("Redis 연결 실패 — Refresh Token 조회 실패: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public void delete(Long userId) {
        try {
            redisTemplate.delete(PREFIX + userId);
        } catch (Exception e) {
            log.warn("Redis 연결 실패 — Refresh Token 삭제 생략: {}", e.getMessage());
        }
    }
}
