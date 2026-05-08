package com.farmbalance.shop.application.port.out;

import com.farmbalance.shop.domain.Order;

import java.util.List;
import java.util.Optional;

/**
 * 주문 영속성 Port (Output Port).
 */
public interface OrderRepository {

    /** 주문 저장 */
    Order save(Order order);

    /** 모든 주문 조회 (관리자용) */
    List<Order> findAll();

    /** 주문 조회 */
    Optional<Order> findById(Long id);

    /** 구매자의 주문 내역 */
    List<Order> findByBuyerId(Long buyerId);

    /** 판매자가 받은 주문 목록 */
    List<Order> findBySellerId(Long sellerId);

    /** 송장번호로 주문 조회 */
    Optional<Order> findByTrackingNumber(String trackingNumber);
}
