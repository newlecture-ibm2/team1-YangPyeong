package com.farmbalance.shop.adapter.in.web.dto;

import java.util.List;

/**
 * 상품 수정 요청 DTO.
 * unitKg: 1개당 판매 단위(kg). null 이면 기존 값 유지.
 */
public record ProductUpdateRequest(
        String name,
        int price,
        int stock,
        Integer unitKg,
        String description,
        String categoryName,
        List<String> imageUrls
) {}
