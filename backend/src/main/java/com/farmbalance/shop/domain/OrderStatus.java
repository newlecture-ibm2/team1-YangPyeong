package com.farmbalance.shop.domain;

/**
 * 주문 상태 (순수 enum).
 */
public enum OrderStatus {
    ORDERED,    // 주문 완료 (신규)
    ACCEPTED,   // 접수 확인 (배송 준비)
    SHIPPED,    // 배송중
    COMPLETED,  // 완료
    CANCELLED   // 취소
}
