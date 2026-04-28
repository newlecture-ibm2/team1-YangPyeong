package com.farmbalance.user.domain;

/**
 * 인증 제공자 (순수 도메인 — Framework 의존성 없음)
 */
public enum AuthProvider {
    LOCAL,
    KAKAO,
    GOOGLE
}
