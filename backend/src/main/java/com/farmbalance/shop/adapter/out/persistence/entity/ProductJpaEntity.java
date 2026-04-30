package com.farmbalance.shop.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 상품 JPA 엔티티.
 */
@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "price", nullable = false)
    private int price;

    @Column(name = "stock", nullable = false)
    private int stock;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "sales_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int salesCount;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    public ProductJpaEntity(Long sellerId, Long categoryId, String name, int price, int stock,
                            String description, int salesCount, String status) {
        this.sellerId = sellerId;
        this.categoryId = categoryId;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.salesCount = salesCount;
        this.status = status;
    }

    // ── 업데이트 메서드 ──

    public void update(String name, int price, int stock, String description, Long categoryId) {
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.description = description;
        if (categoryId != null) {
            this.categoryId = categoryId;
        }
    }

    public void updateStock(int stock) {
        this.stock = stock;
    }

    public void updateSalesCount(int salesCount) {
        this.salesCount = salesCount;
    }

    public void updateStatus(String status) {
        this.status = status;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
