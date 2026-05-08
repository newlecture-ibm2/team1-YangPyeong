package com.farmbalance.shop.domain;

/**
 * 상품 상태 (순수 enum).
 */
public enum ProductStatus {
    PENDING,    // 승인 대기
    ACTIVE,     // 판매중
    INACTIVE,   // 숨김 (판매 중단)
    REJECTED,   // 거절
    SOLDOUT     // 품절 (재고 0이거나 수동 지정)
}
