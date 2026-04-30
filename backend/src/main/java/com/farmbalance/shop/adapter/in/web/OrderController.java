package com.farmbalance.shop.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.shop.adapter.in.web.dto.OrderCreateRequest;
import com.farmbalance.shop.adapter.in.web.dto.OrderResponse;
import com.farmbalance.shop.adapter.in.web.dto.OrderStatusUpdateRequest;
import com.farmbalance.shop.application.port.in.OrderUseCase;
import com.farmbalance.shop.domain.Order;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 주문 Controller (Driving Adapter).
 * 구매자 주문 + 판매자 주문 관리 API.
 */
@RestController
@RequestMapping("/api/shop")
public class OrderController {

    private final OrderUseCase orderUseCase;

    public OrderController(OrderUseCase orderUseCase) {
        this.orderUseCase = orderUseCase;
    }

    // ── 구매자 ──

    /** 주문 생성 */
    @PostMapping("/order")
    public ApiResponse<OrderResponse> createOrder(@RequestBody OrderCreateRequest request) {
        Long buyerId = SecurityUtil.getCurrentUserId();

        List<OrderUseCase.OrderItemCommand> commands = request.items().stream()
                .map(item -> new OrderUseCase.OrderItemCommand(item.productId(), item.quantity()))
                .toList();

        Order order = orderUseCase.createOrder(
                buyerId, request.receiverName(), request.receiverPhone(),
                request.shippingAddress(), request.shippingMemo(), commands
        );
        return ApiResponse.ok(OrderResponse.from(order));
    }

    /** 내 주문 내역 */
    @GetMapping("/order")
    public ApiResponse<List<OrderResponse>> getMyOrders() {
        Long buyerId = SecurityUtil.getCurrentUserId();
        List<Order> orders = orderUseCase.getMyOrders(buyerId);
        return ApiResponse.ok(orders.stream().map(OrderResponse::from).toList());
    }

    // ── 판매자 ──

    /** 판매자 주문 목록 */
    @GetMapping("/seller/order")
    public ApiResponse<List<OrderResponse>> getSellerOrders() {
        Long sellerId = SecurityUtil.getCurrentUserId();
        List<Order> orders = orderUseCase.getSellerOrders(sellerId);
        return ApiResponse.ok(orders.stream().map(OrderResponse::from).toList());
    }

    /** 주문 상태 변경 */
    @PatchMapping("/seller/order/{id}")
    public ApiResponse<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                         @RequestBody OrderStatusUpdateRequest request) {
        Long sellerId = SecurityUtil.getCurrentUserId();
        Order order;
        if ("cancel".equals(request.action())) {
            order = orderUseCase.cancelOrder(sellerId, id);
        } else {
            order = orderUseCase.advanceOrderStatus(sellerId, id);
        }
        return ApiResponse.ok(OrderResponse.from(order));
    }
}
