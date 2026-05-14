package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.entity.OrderJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.OrderJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 주문 자동 상태 전환 비즈니스 로직.
 *
 * <p>Scheduler에서 직접 {@code @Transactional} 메서드를 호출하면
 * Spring 프록시 self-invocation 문제로 트랜잭션이 적용되지 않으므로,
 * 별도 Service 클래스로 분리하여 프록시를 통한 호출을 보장합니다.</p>
 */
@Service
public class OrderAutoAdvanceService {

    private static final Logger log = LoggerFactory.getLogger(OrderAutoAdvanceService.class);

    private static final int AUTO_SHIP_HOURS = 24;
    private static final int AUTO_COMPLETE_HOURS = 24;

    private final OrderJpaRepository orderJpaRepository;

    public OrderAutoAdvanceService(OrderJpaRepository orderJpaRepository) {
        this.orderJpaRepository = orderJpaRepository;
    }

    /** 비즈니스 로직 — 프록시를 통해 호출되므로 @Transactional 정상 동작 */
    @Transactional
    public void autoAdvance() {
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
