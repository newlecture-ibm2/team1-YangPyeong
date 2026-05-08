package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.entity.OrderJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.OrderJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 주문 자동 배송 상태 전환 스케줄러.
 *
 * <p>배송 흐름 (시간 기반 자동 전환):</p>
 * <ul>
 *   <li>ACCEPTED → SHIPPED: 접수 후 24시간 경과 시 자동 발송 (판매자 미처리 안전망)</li>
 *   <li>SHIPPED → COMPLETED: 발송 후 24시간 경과 시 자동 배송완료</li>
 * </ul>
 */
@Component
public class OrderAutoCompleteScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrderAutoCompleteScheduler.class);

    /** 자동 전환까지 걸리는 시간 (시간 단위) */
    private static final int AUTO_SHIP_HOURS = 24;
    private static final int AUTO_COMPLETE_HOURS = 24;

    private final OrderJpaRepository orderJpaRepository;

    public OrderAutoCompleteScheduler(OrderJpaRepository orderJpaRepository) {
        this.orderJpaRepository = orderJpaRepository;
    }

    /**
     * 매 1시간마다 실행.
     * 1) ACCEPTED 상태 + 24시간 경과 → 자동 SHIPPED (더미 송장번호 발급)
     * 2) SHIPPED 상태 + 24시간 경과 → 자동 COMPLETED
     */
    @Scheduled(fixedRate = 3600000) // 1시간 = 3,600,000ms
    @Transactional
    public void autoAdvanceOrders() {
        autoShipOrders();
        autoCompleteOrders();
    }

    /** ACCEPTED → SHIPPED: 판매자가 발송 처리를 안 한 경우 자동 발송 */
    private void autoShipOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(AUTO_SHIP_HOURS);

        List<OrderJpaEntity> unshippedOrders = orderJpaRepository
                .findByStatusAndUpdatedAtBefore("ACCEPTED", threshold);

        if (unshippedOrders.isEmpty()) return;

        for (OrderJpaEntity order : unshippedOrders) {
            String trackingNumber = "FARM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            order.ship(trackingNumber);
            log.info("[자동 발송] 주문 {} → SHIPPED (송장: {}, 접수 후 {}시간 경과)",
                    order.getOrderNumber(), trackingNumber, AUTO_SHIP_HOURS);
        }

        orderJpaRepository.saveAll(unshippedOrders);
        log.info("[자동 발송] 총 {}건 배송중 처리", unshippedOrders.size());
    }

    /** SHIPPED → COMPLETED: 발송 후 24시간 경과 시 자동 배송완료 */
    private void autoCompleteOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(AUTO_COMPLETE_HOURS);

        List<OrderJpaEntity> shippedOrders = orderJpaRepository
                .findByStatusAndUpdatedAtBefore("SHIPPED", threshold);

        if (shippedOrders.isEmpty()) return;

        for (OrderJpaEntity order : shippedOrders) {
            order.updateStatus("COMPLETED");
            log.info("[자동 완료] 주문 {} → COMPLETED (발송 후 {}시간 경과)",
                    order.getOrderNumber(), AUTO_COMPLETE_HOURS);
        }

        orderJpaRepository.saveAll(shippedOrders);
        log.info("[자동 완료] 총 {}건 배송완료 처리", shippedOrders.size());
    }
}
