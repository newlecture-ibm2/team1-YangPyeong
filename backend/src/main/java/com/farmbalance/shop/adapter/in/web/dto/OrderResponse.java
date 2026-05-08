package com.farmbalance.shop.adapter.in.web.dto;

import com.farmbalance.shop.domain.Order;
import com.farmbalance.shop.domain.OrderItem;

import java.util.List;

/**
 * 주문 응답 DTO.
 */
public record OrderResponse(
        Long id,
        Long buyerId,
        String orderNumber,
        int totalAmount,
        String status,
        String receiverName,
        String receiverPhone,
        String shippingAddress,
        String shippingMemo,
        String trackingNumber,
        String shippedAt,
        List<OrderItemDto> items,
        String createdAt,
        String updatedAt
) {
    public record OrderItemDto(
            Long id,
            Long orderId,
            Long productId,
            String productName,
            int quantity,
            int unitPrice,
            int subtotal
    ) {
        public static OrderItemDto from(OrderItem item) {
            return new OrderItemDto(
                    item.getId(), item.getOrderId(), item.getProductId(),
                    item.getProductName(), item.getQuantity(),
                    item.getUnitPrice(), item.getSubtotal()
            );
        }
    }

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(), order.getBuyerId(), order.getOrderNumber(),
                order.getTotalAmount(), order.getStatus().name(),
                order.getReceiverName(), order.getReceiverPhone(),
                order.getShippingAddress(), order.getShippingMemo(),
                order.getTrackingNumber(),
                order.getShippedAt() != null ? order.getShippedAt().toString() : null,
                order.getItems() != null
                        ? order.getItems().stream().map(OrderItemDto::from).toList()
                        : List.of(),
                order.getCreatedAt() != null ? order.getCreatedAt().toString() : null,
                order.getUpdatedAt() != null ? order.getUpdatedAt().toString() : null
        );
    }
}
