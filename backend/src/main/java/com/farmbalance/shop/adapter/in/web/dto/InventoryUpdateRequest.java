package com.farmbalance.shop.adapter.in.web.dto;

/**
 * 가격·재고 수정 요청 DTO (운영 정보 — 검수 상태와 무관하게 즉시 반영).
 * price, stock 중 하나 이상 포함해야 합니다. null인 항목은 기존 값 유지.
 */
public record InventoryUpdateRequest(
        Integer price,
        Integer stock
) {}
