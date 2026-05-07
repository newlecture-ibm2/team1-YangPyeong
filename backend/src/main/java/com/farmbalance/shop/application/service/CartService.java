package com.farmbalance.shop.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.in.CartUseCase;
import com.farmbalance.shop.application.port.out.CartRepository;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.CartItem;
import com.farmbalance.shop.domain.Product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 장바구니 서비스 (UseCase 구현체).
 */
@Service
@Transactional(readOnly = true)
public class CartService implements CartUseCase {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<CartItem> getCartItems(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public CartItem addToCart(Long userId, Long productId, int quantity) {
        // 상품 존재 확인
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        // 이미 장바구니에 있으면 수량 증가
        Optional<CartItem> existing = cartRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.changeQuantity(item.getQuantity() + quantity);
            return cartRepository.save(item);
        }

        CartItem cartItem = new CartItem(null, userId, productId, quantity, null);
        return cartRepository.save(cartItem);
    }

    @Override
    @Transactional
    public CartItem updateCartQuantity(Long userId, Long cartItemId, int quantity) {
        CartItem item = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!item.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        item.changeQuantity(quantity);
        return cartRepository.save(item);
    }

    @Override
    @Transactional
    public void removeCartItem(Long userId, Long cartItemId) {
        CartItem item = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!item.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        cartRepository.delete(cartItemId);
    }
}
