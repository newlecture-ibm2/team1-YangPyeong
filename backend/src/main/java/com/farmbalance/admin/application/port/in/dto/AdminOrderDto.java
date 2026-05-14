package com.farmbalance.admin.application.port.in.dto;

import com.farmbalance.shop.domain.Order;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class AdminOrderDto {
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
    private List<AdminOrderItemDto> items;

    @Getter
    @Builder
    public static class AdminOrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private int quantity;
        private int unitPrice;
    }

    public static AdminOrderDto from(Order order) {
        List<AdminOrderItemDto> itemDtos = order.getItems().stream()
                .map(item -> AdminOrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return AdminOrderDto.builder()
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
                .items(itemDtos)
                .build();
    }
}
