package com.farmbalance.shop.application.port.in;

import com.farmbalance.shop.domain.Order;

import java.util.List;

/**
 * 주문 UseCase (Input Port).
 */
public interface OrderUseCase {

    /** 주문 생성 */
    Order createOrder(Long buyerId, String receiverName, String receiverPhone,
                      String shippingAddress, String shippingMemo,
                      List<OrderItemCommand> items);

    /** 내 주문 내역 조회 */
    List<Order> getMyOrders(Long buyerId);

    /** 판매자 주문 목록 조회 */
    List<Order> getSellerOrders(Long sellerId);

    /** 주문 상태 전진 (판매자) */
    Order advanceOrderStatus(Long sellerId, Long orderId);

    /** 발송 처리 (ACCEPTED → SHIPPED + 송장번호 발급) */
    Order shipOrder(Long sellerId, Long orderId);

    /** 주문 취소 (판매자 거절) */
    Order cancelOrder(Long sellerId, Long orderId);

    /** 주문 취소 (구매자 — ORDERED 상태일 때만 허용) */
    Order buyerCancelOrder(Long buyerId, Long orderId);

    /** 주문 항목 커맨드 */
    record OrderItemCommand(Long productId, int quantity) {}
}
