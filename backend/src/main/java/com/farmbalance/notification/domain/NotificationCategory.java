package com.farmbalance.notification.domain;

/**
 * 알림 카테고리 — 사용자 알림 설정(NotificationPreference)과 매핑되는 8가지 분류.
 * <p>
 * NotificationType은 DB 저장용 5가지(BALANCE_WARN, GUIDE, POLICY, ORDER, SYSTEM)인 반면,
 * NotificationCategory는 GUIDE 타입을 4개 세부로 분리한 설정 기준입니다.
 */
public enum NotificationCategory {
    /** 수급 임계값 경고 */
    BALANCE_WARN,
    /** 정책 매칭 알림 */
    POLICY,
    /** 주문 상태 변경 알림 */
    ORDER,
    /** 시스템 알림 (농장 승인/반려, 댓글 등) */
    SYSTEM,
    /** 영농 가이드 - 기상 기반 */
    GUIDE_WEATHER,
    /** 영농 가이드 - 재배 일정 */
    GUIDE_SCHEDULE,
    /** 영농 가이드 - 병해충 */
    GUIDE_PEST,
    /** 영농 가이드 - 토양 */
    GUIDE_SOIL
}
