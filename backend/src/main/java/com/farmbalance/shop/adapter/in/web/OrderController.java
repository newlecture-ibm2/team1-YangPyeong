package com.farmbalance.shop.adapter.in.web;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.shop.adapter.in.web.dto.OrderCreateRequest;
import com.farmbalance.shop.adapter.in.web.dto.OrderResponse;
import com.farmbalance.shop.adapter.in.web.dto.OrderStatusUpdateRequest;
import com.farmbalance.shop.application.port.in.OrderUseCase;
import com.farmbalance.shop.application.port.out.OrderRepository;
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
    private final OrderRepository orderRepository;

    public OrderController(OrderUseCase orderUseCase, OrderRepository orderRepository) {
        this.orderUseCase = orderUseCase;
        this.orderRepository = orderRepository;
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

    /** 주문 취소 (구매자 — ORDERED 상태일 때만) */
    @PatchMapping("/order/{id}/cancel")
    public ApiResponse<OrderResponse> cancelMyOrder(@PathVariable Long id) {
        Long buyerId = SecurityUtil.getCurrentUserId();
        Order order = orderUseCase.buyerCancelOrder(buyerId, id);
        return ApiResponse.ok(OrderResponse.from(order));
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
        } else if ("ship".equals(request.action())) {
            order = orderUseCase.shipOrder(sellerId, id);
        } else {
            order = orderUseCase.advanceOrderStatus(sellerId, id);
        }
        return ApiResponse.ok(OrderResponse.from(order));
    }

    // ── 배송 조회 (더미 택배사) ──

    /** 더미 택배 배송 추적 */
    @GetMapping("/courier/track")
    public ApiResponse<List<TrackingEvent>> trackOrder(@RequestParam String trackingNumber) {
        Long userId = SecurityUtil.getCurrentUserId();

        // 해당 송장번호의 주문 찾기
        Order order = orderRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getShippedAt() == null) {
            return ApiResponse.ok(List.of());
        }

        // 발송 시각 기준으로 시간 흐름에 따른 더미 배송 이벤트 생성
        List<TrackingEvent> events = generateTrackingEvents(order.getShippedAt());
        return ApiResponse.ok(events);
    }

    /** 배송 추적 이벤트 */
    public record TrackingEvent(String time, String location, String description, boolean current) {}

    /** 시간 흐름에 따른 더미 배송 이벤트 생성 */
    private List<TrackingEvent> generateTrackingEvents(java.time.LocalDateTime shippedAt) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        long hoursElapsed = java.time.Duration.between(shippedAt, now).toHours();

        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MM/dd HH:mm");
        java.util.List<TrackingEvent> events = new java.util.ArrayList<>();

        // Step 1: 물류센터 인수 (즉시)
        events.add(new TrackingEvent(shippedAt.format(fmt), "양평 물류센터", "상품 인수 완료", hoursElapsed < 4));

        // Step 2: HUB 간선상차 (+4시간)
        if (hoursElapsed >= 4) {
            events.add(new TrackingEvent(shippedAt.plusHours(4).format(fmt), "옥천 HUB", "간선상차", hoursElapsed < 12));
        }

        // Step 3: 배달 지역 도착 (+12시간)
        if (hoursElapsed >= 12) {
            events.add(new TrackingEvent(shippedAt.plusHours(12).format(fmt), "고객 지역 터미널", "배달 출발", hoursElapsed < 24));
        }

        // Step 4: 배달 완료 (+24시간)
        if (hoursElapsed >= 24) {
            events.add(new TrackingEvent(shippedAt.plusHours(24).format(fmt), "수령지", "배달 완료", true));
        }

        return events;
    }
}
