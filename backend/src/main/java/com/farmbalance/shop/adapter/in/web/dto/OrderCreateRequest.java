package com.farmbalance.shop.adapter.in.web.dto;

import java.util.List;

/**
 * 주문 생성 요청 DTO.
 */
public record OrderCreateRequest(
        String receiverName,
        String receiverPhone,
        String shippingAddress,
        String shippingMemo,
        List<OrderItemRequest> items
) {
    public record OrderItemRequest(
            Long productId,
            int quantity
    ) {}
}
