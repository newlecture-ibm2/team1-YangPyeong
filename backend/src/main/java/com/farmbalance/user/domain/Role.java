package com.farmbalance.user.domain;

/**
 * 사용자 역할 (순수 도메인 — Spring 의존성 없음)
 */
public enum Role {
    USER,
    FARMER,
    GOV,
    ADMIN
}
