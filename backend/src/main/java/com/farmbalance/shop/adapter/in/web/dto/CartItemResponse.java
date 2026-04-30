package com.farmbalance.shop.adapter.in.web.dto;

import com.farmbalance.shop.domain.CartItem;

/**
 * 장바구니 응답 DTO.
 */
public record CartItemResponse(
        Long id,
        Long userId,
        Long productId,
        int quantity,
        ProductResponse product
) {
    public static CartItemResponse from(CartItem cartItem) {
        return new CartItemResponse(
                cartItem.getId(),
                cartItem.getUserId(),
                cartItem.getProductId(),
                cartItem.getQuantity(),
                cartItem.getProduct() != null ? ProductResponse.from(cartItem.getProduct()) : null
        );
    }
}
