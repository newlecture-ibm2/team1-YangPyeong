package com.farmbalance.user.domain;

/**
 * 사용자 계정 상태 (순수 도메인 — Spring 의존성 없음)
 */
public enum UserStatus {
    ACTIVE,
    SUSPENDED,
    PENDING
}
