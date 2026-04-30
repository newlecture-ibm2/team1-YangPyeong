package com.farmbalance.shop.adapter.in.web.dto;

/**
 * 장바구니 수량 변경 요청 DTO.
 */
public record CartUpdateRequest(
        int quantity
) {}
