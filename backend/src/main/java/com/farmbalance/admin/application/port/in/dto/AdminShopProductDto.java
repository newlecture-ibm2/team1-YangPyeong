package com.farmbalance.admin.application.port.in.dto;

import com.farmbalance.shop.domain.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminShopProductDto {

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
    private String status;
    private LocalDateTime createdAt;

    public static AdminShopProductDto from(Product product, String sellerName) {
        return AdminShopProductDto.builder()
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
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
