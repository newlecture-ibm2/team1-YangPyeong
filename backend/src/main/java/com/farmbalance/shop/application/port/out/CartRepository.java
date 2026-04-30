package com.farmbalance.shop.application.port.out;

import com.farmbalance.shop.domain.CartItem;

import java.util.List;
import java.util.Optional;

/**
 * 장바구니 영속성 Port (Output Port).
 */
public interface CartRepository {

    /** 장바구니 항목 저장 */
    CartItem save(CartItem cartItem);

    /** 사용자의 장바구니 조회 */
    List<CartItem> findByUserId(Long userId);

    /** 장바구니 항목 조회 */
    Optional<CartItem> findById(Long id);

    /** 사용자 + 상품으로 기존 장바구니 항목 조회 */
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    /** 장바구니 항목 삭제 */
    void delete(Long id);

    /** 사용자의 장바구니 전체 비우기 */
    void deleteByUserId(Long userId);
}
