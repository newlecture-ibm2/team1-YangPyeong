package com.farmbalance.user.domain.event;

/**
 * 유저 탈퇴 후 30일 유예기간 만료 시 발행.
 * 농장 Soft Delete, 장바구니/찜 Hard Delete 등 타 도메인 최종 정리를 트리거합니다.
 */
public record UserGracePeriodExpiredEvent(Long userId) {
}
