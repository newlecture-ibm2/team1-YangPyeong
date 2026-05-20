package com.farmbalance.shop.adapter.in.web.dto;

import java.util.List;

/**
 * 상품 등록 요청 DTO.
 * unitKg: 1개당 판매 단위(kg). 미지정 시 1kg.
 */
public record ProductRegisterRequest(
        String name,
        int price,
        int stock,
        Integer unitKg,
        String description,
        String categoryName,
        List<String> imageUrls
) {
    public int unitKgOrDefault() {
        return unitKg == null || unitKg < 1 ? 1 : unitKg;
    }
}
