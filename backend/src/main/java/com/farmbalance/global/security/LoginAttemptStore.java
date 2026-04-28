package com.farmbalance.global.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Redis 기반 로그인 시도 추적.
 * 5회 실패 시 30분간 로그인 잠금.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoginAttemptStore {

    private final StringRedisTemplate redisTemplate;

    private static final String PREFIX = "login-fail:";
    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 30;

    /** 잠금 상태 확인 */
    public boolean isLocked(String email) {
        try {
            String count = redisTemplate.opsForValue().get(PREFIX + email);
            return count != null && Integer.parseInt(count) >= MAX_ATTEMPTS;
        } catch (Exception e) {
            log.warn("Redis 연결 실패 — 로그인 잠금 확인 생략: {}", e.getMessage());
            return false;
        }
    }

    /** 실패 기록. 5회 도달 시 30분 잠금 */
    public void recordFailure(String email) {
        try {
            Long count = redisTemplate.opsForValue().increment(PREFIX + email);
            if (count != null && count == 1) {
                redisTemplate.expire(PREFIX + email, 60, TimeUnit.MINUTES);
            }
            if (count != null && count >= MAX_ATTEMPTS) {
                redisTemplate.expire(PREFIX + email, LOCK_DURATION_MINUTES, TimeUnit.MINUTES);
            }
        } catch (Exception e) {
            log.warn("Redis 연결 실패 — 로그인 실패 기록 생략: {}", e.getMessage());
        }
    }

    /** 성공 시 시도 횟수 초기화 */
    public void resetAttempts(String email) {
        try {
            redisTemplate.delete(PREFIX + email);
        } catch (Exception e) {
            log.warn("Redis 연결 실패 — 로그인 시도 초기화 생략: {}", e.getMessage());
        }
    }

    /** 남은 시도 횟수 */
    public int getRemainingAttempts(String email) {
        try {
            String count = redisTemplate.opsForValue().get(PREFIX + email);
            if (count == null) return MAX_ATTEMPTS;
            return Math.max(0, MAX_ATTEMPTS - Integer.parseInt(count));
        } catch (Exception e) {
            return MAX_ATTEMPTS;
        }
    }

    /** 잠금 남은 시간 (분) */
    public long getLockRemainingMinutes(String email) {
        try {
            Long ttl = redisTemplate.getExpire(PREFIX + email, TimeUnit.MINUTES);
            return (ttl != null && ttl > 0) ? ttl : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
