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
    private String trackingNumber;
    private LocalDateTime shippedAt;
    private List<OrderItem> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Order() {
    }

    public Order(Long id, Long buyerId, String orderNumber, int totalAmount, OrderStatus status,
                 String receiverName, String receiverPhone, String shippingAddress,
                 String shippingMemo, String trackingNumber, LocalDateTime shippedAt,
                 List<OrderItem> items, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.buyerId = buyerId;
        this.orderNumber = orderNumber;
        this.totalAmount = totalAmount;
        this.status = status;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.shippingAddress = shippingAddress;
        this.shippingMemo = shippingMemo;
        this.trackingNumber = trackingNumber;
        this.shippedAt = shippedAt;
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
    public String getTrackingNumber() { return trackingNumber; }
    public LocalDateTime getShippedAt() { return shippedAt; }
    public List<OrderItem> getItems() { return items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ── 비즈니스 로직 ──

    /** 주문 상태 전진 (ORDERED → ACCEPTED) — 판매자 접수 */
    public void accept() {
        if (this.status != OrderStatus.ORDERED) {
            throw new IllegalStateException("접수 가능한 상태가 아닙니다: " + this.status);
        }
        this.status = OrderStatus.ACCEPTED;
    }

    /** 발송 처리 (ACCEPTED → SHIPPED) — 판매자 발송 완료 */
    public void ship(String trackingNumber) {
        if (this.status != OrderStatus.ACCEPTED) {
            throw new IllegalStateException("발송 가능한 상태가 아닙니다: " + this.status);
        }
        this.status = OrderStatus.SHIPPED;
        this.trackingNumber = trackingNumber;
        this.shippedAt = LocalDateTime.now();
    }

    /** 배송 완료 (SHIPPED → COMPLETED) — 시스템 자동 처리 */
    public void complete() {
        if (this.status != OrderStatus.SHIPPED) {
            throw new IllegalStateException("완료 가능한 상태가 아닙니다: " + this.status);
        }
        this.status = OrderStatus.COMPLETED;
    }

    /** 주문 상태 전진 (기존 호환용 — advanceOrderStatus API에서 사용) */
    public void advanceStatus() {
        switch (this.status) {
            case ORDERED -> accept();
            case ACCEPTED -> throw new IllegalStateException("발송 처리는 ship()을 사용하세요.");
            case SHIPPED -> complete();
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
