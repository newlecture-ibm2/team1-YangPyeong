package com.farmbalance.user.domain.event;

/**
 * 유저 최종 탈퇴(WITHDRAWN) 확정 시 발행 — 타 도메인(예: 농장 Soft Delete)이 구독합니다.
 */
public record UserWithdrawnEvent(Long userId) {
}
