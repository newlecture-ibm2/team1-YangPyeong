package com.farmbalance.shop.adapter.in.web.dto;

/**
 * 주문 상태 변경 요청 DTO.
 */
public record OrderStatusUpdateRequest(
        String action  // "advance" 또는 "cancel"
) {}
