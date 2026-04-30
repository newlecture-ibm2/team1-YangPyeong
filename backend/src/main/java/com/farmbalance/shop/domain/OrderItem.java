package com.farmbalance.shop.domain;

/**
 * 주문 항목 도메인 객체 (순수 POJO).
 */
public class OrderItem {

    private Long id;
    private Long orderId;
    private Long productId;
    private String productName;
    private int quantity;
    private int unitPrice;
    private int subtotal;

    public OrderItem() {
    }

    public OrderItem(Long id, Long orderId, Long productId, String productName,
                     int quantity, int unitPrice) {
        this.id = id;
        this.orderId = orderId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = quantity * unitPrice;
    }

    // ── Getter ──

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public int getUnitPrice() { return unitPrice; }
    public int getSubtotal() { return subtotal; }
}
