package com.farmbalance.shop.application.port.in;

import com.farmbalance.shop.domain.CartItem;

import java.util.List;

/**
 * 장바구니 UseCase (Input Port).
 */
public interface CartUseCase {

    /** 장바구니 조회 */
    List<CartItem> getCartItems(Long userId);

    /** 장바구니 담기 (중복 시 수량 증가) */
    CartItem addToCart(Long userId, Long productId, int quantity);

    /** 장바구니 수량 변경 */
    CartItem updateCartQuantity(Long userId, Long cartItemId, int quantity);

    /** 장바구니 항목 삭제 */
    void removeCartItem(Long userId, Long cartItemId);
}
