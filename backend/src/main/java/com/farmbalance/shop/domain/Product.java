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

    /** 판매 수량 증가 */
    public void increaseSalesCount(int quantity) {
        this.salesCount += quantity;
    }

    /** 상품 수정 */
    public void update(String name, int price, int stock, String description,
                       Long categoryId, String categoryName) {
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
    }

    /** 상태 변경 */
    public void changeStatus(ProductStatus status) {
        this.status = status;
    }
}
