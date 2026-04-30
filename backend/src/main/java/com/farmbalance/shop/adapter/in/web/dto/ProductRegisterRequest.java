package com.farmbalance.shop.adapter.in.web.dto;

import java.util.List;

/**
 * 상품 등록 요청 DTO.
 */
public record ProductRegisterRequest(
        String name,
        int price,
        int stock,
        String description,
        String categoryName,
        List<String> imageUrls
) {}
