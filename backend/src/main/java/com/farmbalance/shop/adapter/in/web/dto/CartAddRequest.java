package com.farmbalance.shop.adapter.in.web.dto;

/**
 * 장바구니 담기 요청 DTO.
 */
public record CartAddRequest(
        Long productId,
        int quantity
) {}
