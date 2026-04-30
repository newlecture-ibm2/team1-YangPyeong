package com.farmbalance.shop.adapter.in.web.dto;

import java.util.List;

/**
 * 상품 수정 요청 DTO.
 */
public record ProductUpdateRequest(
        String name,
        int price,
        int stock,
        String description,
        String categoryName,
        List<String> imageUrls
) {}
