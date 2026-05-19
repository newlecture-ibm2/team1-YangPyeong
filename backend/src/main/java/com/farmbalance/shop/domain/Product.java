package com.farmbalance.shop.domain;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 상품 도메인 객체 (순수 POJO).
 * JPA, Spring 등 프레임워크에 의존하지 않습니다.
 */
public class Product {

    private Long id;
    private Long sellerId;
    private String sellerName;
    private Long categoryId;
    private String categoryName;
    private String name;
    private int price;
    private int stock;
    private String description;
    private int salesCount;
    private ProductStatus status;
    private List<String> imageUrls;
    private LocalDateTime createdAt;

    public Product() {
    }

    public Product(Long id, Long sellerId, String sellerName, Long categoryId, String categoryName,
                   String name, int price, int stock, String description, int salesCount,
                   ProductStatus status, List<String> imageUrls, LocalDateTime createdAt) {
        this.id = id;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.salesCount = salesCount;
        this.status = status;
        this.imageUrls = imageUrls;
        this.createdAt = createdAt;
    }

    // ── Getter ──

    public Long getId() { return id; }
    public Long getSellerId() { return sellerId; }
    public String getSellerName() { return sellerName; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public String getName() { return name; }
    public int getPrice() { return price; }
    public int getStock() { return stock; }
    public String getDescription() { return description; }
    public int getSalesCount() { return salesCount; }
    public ProductStatus getStatus() { return status; }
    public List<String> getImageUrls() { return imageUrls; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ── 비즈니스 로직 ──

    /** 재고 차감 */
    public void decreaseStock(int quantity) {
        if (this.stock < quantity) {
            throw new IllegalArgumentException("재고가 부족합니다.");
        }
        this.stock -= quantity;
    }

    /** 재고 복구 (주문 취소 시) */
    public void increaseStock(int quantity) {
        this.stock += quantity;
    }

    /** 판매 수량 증가 */
    public void increaseSalesCount(int quantity) {
        this.salesCount += quantity;
    }

    /** 판매 수량 감소 (주문 취소 시) */
    public void decreaseSalesCount(int quantity) {
        this.salesCount = Math.max(0, this.salesCount - quantity);
    }

    /** 상품 전체 수정 (이름·설명·카테고리·이미지 포함) */
    public void update(String name, int price, int stock, String description,
                       Long categoryId, String categoryName) {
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
    }

    /**
     * 가격·재고만 수정 (운영 정보 — 검수 상태와 무관하게 즉시 반영).
     * 이름·설명·카테고리·이미지 등 콘텐츠 필드는 변경하지 않으므로 재검수 불필요.
     */
    public void updateInventory(int price, int stock) {
        this.price = price;
        this.stock = stock;
    }

    /** 상태 변경 */
    public void changeStatus(ProductStatus status) {
        this.status = status;
    }
}
