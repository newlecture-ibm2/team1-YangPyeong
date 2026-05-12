package com.farmbalance.user.domain;

/**
 * 사용자 계정 상태 (순수 도메인 — Spring 의존성 없음)
 */
public enum UserStatus {
    ACTIVE,
    SUSPENDED,
    PENDING,
    /** 탈퇴 유예 중 — 로그인 가능, 유예 종료 시 WITHDRAWN으로 전환 */
    PENDING_WITHDRAWAL,
    WITHDRAWN
}
