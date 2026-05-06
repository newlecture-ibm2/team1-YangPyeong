package com.farmbalance.shop.domain;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 주문 도메인 객체 (순수 POJO).
 */
public class Order {

    private Long id;
    private Long buyerId;
    private String orderNumber;
    private int totalAmount;
    private OrderStatus status;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String shippingMemo;
    private List<OrderItem> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Order() {
    }

    public Order(Long id, Long buyerId, String orderNumber, int totalAmount, OrderStatus status,
                 String receiverName, String receiverPhone, String shippingAddress,
                 String shippingMemo, List<OrderItem> items, LocalDateTime createdAt,
                 LocalDateTime updatedAt) {
        this.id = id;
        this.buyerId = buyerId;
        this.orderNumber = orderNumber;
        this.totalAmount = totalAmount;
        this.status = status;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.shippingAddress = shippingAddress;
        this.shippingMemo = shippingMemo;
        this.items = items;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ── Getter ──

    public Long getId() { return id; }
    public Long getBuyerId() { return buyerId; }
    public String getOrderNumber() { return orderNumber; }
    public int getTotalAmount() { return totalAmount; }
    public OrderStatus getStatus() { return status; }
    public String getReceiverName() { return receiverName; }
    public String getReceiverPhone() { return receiverPhone; }
    public String getShippingAddress() { return shippingAddress; }
    public String getShippingMemo() { return shippingMemo; }
    public List<OrderItem> getItems() { return items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ── 비즈니스 로직 ──

    /** 주문 상태 전진 (ORDERED → ACCEPTED → SHIPPED → COMPLETED) */
    public void advanceStatus() {
        switch (this.status) {
            case ORDERED -> this.status = OrderStatus.ACCEPTED;
            case ACCEPTED -> this.status = OrderStatus.SHIPPED;
            case SHIPPED -> this.status = OrderStatus.COMPLETED;
            default -> throw new IllegalStateException("현재 상태에서 전진할 수 없습니다: " + this.status);
        }
    }

    /** 주문 취소 */
    public void cancel() {
        if (this.status == OrderStatus.SHIPPED || this.status == OrderStatus.COMPLETED) {
            throw new IllegalStateException("배송 시작 후에는 취소할 수 없습니다.");
        }
        this.status = OrderStatus.CANCELLED;
    }
}
