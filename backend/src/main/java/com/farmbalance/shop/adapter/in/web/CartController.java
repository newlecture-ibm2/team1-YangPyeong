package com.farmbalance.shop.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.shop.adapter.in.web.dto.CartAddRequest;
import com.farmbalance.shop.adapter.in.web.dto.CartItemResponse;
import com.farmbalance.shop.adapter.in.web.dto.CartUpdateRequest;
import com.farmbalance.shop.application.port.in.CartUseCase;
import com.farmbalance.shop.domain.CartItem;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 장바구니 Controller (Driving Adapter).
 */
@RestController
@RequestMapping("/api/shop/cart")
public class CartController {

    private final CartUseCase cartUseCase;

    public CartController(CartUseCase cartUseCase) {
        this.cartUseCase = cartUseCase;
    }

    /** 장바구니 조회 */
    @GetMapping
    public ApiResponse<List<CartItemResponse>> getCartItems() {
        Long userId = SecurityUtil.getCurrentUserId();
        List<CartItem> items = cartUseCase.getCartItems(userId);
        return ApiResponse.ok(items.stream().map(CartItemResponse::from).toList());
    }

    /** 장바구니 담기 */
    @PostMapping
    public ApiResponse<CartItemResponse> addToCart(@RequestBody CartAddRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        CartItem item = cartUseCase.addToCart(userId, request.productId(), request.quantity());
        return ApiResponse.ok(CartItemResponse.from(item));
    }

    /** 장바구니 수량 수정 */
    @PatchMapping("/{id}")
    public ApiResponse<CartItemResponse> updateCartQuantity(@PathVariable Long id,
                                                            @RequestBody CartUpdateRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        CartItem item = cartUseCase.updateCartQuantity(userId, id, request.quantity());
        return ApiResponse.ok(CartItemResponse.from(item));
    }

    /** 장바구니 항목 삭제 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> removeCartItem(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        cartUseCase.removeCartItem(userId, id);
        return ApiResponse.ok(null);
    }
}
