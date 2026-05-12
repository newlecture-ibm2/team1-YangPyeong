package com.farmbalance.notification.domain;

/**
 * 알림 유형 열거형.
 * DB notifications.type 컬럼과 1:1 매핑됩니다.
 */
public enum NotificationType {
    /** 수급 임계값 초과 경고 (FCM 푸시 대상) */
    BALANCE_WARN,
    /** 관리자/지자체 권고 메시지 */
    GUIDE,
    /** 주문 상태 변경 알림 */
    ORDER,
    /** 정책 매칭 결과 알림 */
    POLICY,
    /** 시스템 알림 (공지 등) */
    SYSTEM
}
