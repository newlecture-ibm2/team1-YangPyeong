package com.farmbalance.admin.adapter.in.web.dto;

import com.farmbalance.shop.domain.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * ADM-009 상점 관리 Response DTO
 * AdminProduct(admin.domain) 대체 — Shop 도메인의 Product에서 변환
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminShopProductResponse {

    private Long id;
    private Long sellerId;
    private String sellerName;
    private Long categoryId;
    private String categoryName;
    private String name;
    private int price;
    private int stock;
    private String description;
    private String imageUrl;
    private java.util.List<String> imageUrls;
    private String status;
    private String statusReason;
    private LocalDateTime createdAt;

    /**
     * Shop Product 도메인 → Admin Response DTO 변환
     */
    public static AdminShopProductResponse from(Product product, String sellerName) {
        return AdminShopProductResponse.builder()
                .id(product.getId())
                .sellerId(product.getSellerId())
                .sellerName(sellerName)
                .categoryId(product.getCategoryId())
                .categoryName(product.getCategoryName())
                .name(product.getName())
                .price(product.getPrice())
                .stock(product.getStock())
                .description(product.getDescription())
                .imageUrl(product.getImageUrls() != null && !product.getImageUrls().isEmpty()
                        ? product.getImageUrls().get(0) : null)
                .imageUrls(product.getImageUrls())
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .statusReason(product.getStatusReason())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
