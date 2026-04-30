package com.farmbalance.shop.domain;

/**
 * 장바구니 항목 도메인 객체 (순수 POJO).
 */
public class CartItem {

    private Long id;
    private Long userId;
    private Long productId;
    private int quantity;
    private Product product;

    public CartItem() {
    }

    public CartItem(Long id, Long userId, Long productId, int quantity, Product product) {
        this.id = id;
        this.userId = userId;
        this.productId = productId;
        this.quantity = quantity;
        this.product = product;
    }

    // ── Getter ──

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getProductId() { return productId; }
    public int getQuantity() { return quantity; }
    public Product getProduct() { return product; }

    // ── 비즈니스 로직 ──

    /** 수량 변경 */
    public void changeQuantity(int quantity) {
        if (quantity < 1) {
            throw new IllegalArgumentException("수량은 1 이상이어야 합니다.");
        }
        this.quantity = quantity;
    }
}
