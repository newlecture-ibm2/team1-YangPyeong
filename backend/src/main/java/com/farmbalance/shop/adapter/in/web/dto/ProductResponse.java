package com.farmbalance.shop.adapter.in.web.dto;

import com.farmbalance.shop.domain.Product;

import java.util.List;

/**
 * 상품 응답 DTO.
 * unitKg: 1개당 판매 단위(kg).
 */
public record ProductResponse(
        Long id,
        Long sellerId,
        String sellerName,
        Long categoryId,
        String categoryName,
        String name,
        int price,
        int stock,
        int unitKg,
        String description,
        int salesCount,
        String status,
        String statusReason,
        List<String> imageUrls,
        String createdAt
) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSellerId(),
                product.getSellerName(),
                product.getCategoryId(),
                product.getCategoryName(),
                product.getName(),
                product.getPrice(),
                product.getStock(),
                product.getUnitKg(),
                product.getDescription(),
                product.getSalesCount(),
                product.getStatus().name(),
                product.getStatusReason(),
                product.getImageUrls(),
                product.getCreatedAt() != null ? product.getCreatedAt().toString() : null
        );
    }
}
