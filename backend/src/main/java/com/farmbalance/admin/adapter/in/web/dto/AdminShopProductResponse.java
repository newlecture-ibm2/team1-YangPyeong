package com.farmbalance.admin.adapter.in.web.dto;

import com.farmbalance.shop.domain.Product;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * ADM-009 상점 관리 Response DTO
 * AdminProduct(admin.domain) 대체 — Shop 도메인의 Product에서 변환
 */
@Getter
@Builder
public class AdminShopProductResponse {

    private Long id;
    private Long sellerId;
    private Long categoryId;
    private String name;
    private int price;
    private int stock;
    private String description;
    private String imageUrl;
    private String status;
    private LocalDateTime createdAt;

    /**
     * Shop Product 도메인 → Admin Response DTO 변환
     */
    public static AdminShopProductResponse from(Product product) {
        return AdminShopProductResponse.builder()
                .id(product.getId())
                .sellerId(product.getSellerId())
                .categoryId(product.getCategoryId())
                .name(product.getName())
                .price(product.getPrice())
                .stock(product.getStock())
                .description(product.getDescription())
                .imageUrl(product.getImageUrls() != null && !product.getImageUrls().isEmpty()
                        ? product.getImageUrls().get(0) : null)
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
