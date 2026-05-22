package com.farmbalance.admin.adapter.in.web.dto;

import com.farmbalance.shop.domain.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderResponse {
    private Long id;
    private Long buyerId;
    private String orderNumber;
    private int totalAmount;
    private String status;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String shippingMemo;
    private LocalDateTime createdAt;
    private List<AdminOrderItemResponse> items;

    @Getter
    @Builder
@NoArgsConstructor
@AllArgsConstructor
    public static class AdminOrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private int quantity;
        private int unitPrice;
    }

    public static AdminOrderResponse from(Order order) {
        List<AdminOrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> AdminOrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return AdminOrderResponse.builder()
                .id(order.getId())
                .buyerId(order.getBuyerId())
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .shippingMemo(order.getShippingMemo())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
