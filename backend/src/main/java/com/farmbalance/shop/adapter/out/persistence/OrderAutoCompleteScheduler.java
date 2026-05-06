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

/**
 * 주문 자동 배송완료 스케줄러.
 * 접수(ACCEPTED) 후 24시간이 지난 주문을 자동으로 COMPLETED로 변경합니다.
 */
@Component
public class OrderAutoCompleteScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrderAutoCompleteScheduler.class);

    /** 접수 후 자동 완료까지 걸리는 시간 (시간 단위) */
    private static final int AUTO_COMPLETE_HOURS = 24;

    private final OrderJpaRepository orderJpaRepository;

    public OrderAutoCompleteScheduler(OrderJpaRepository orderJpaRepository) {
        this.orderJpaRepository = orderJpaRepository;
    }

    /**
     * 매 1시간마다 실행하여 ACCEPTED 상태이고 24시간이 지난 주문을 COMPLETED로 변경.
     */
    @Scheduled(fixedRate = 3600000) // 1시간 = 3,600,000ms
    @Transactional
    public void autoCompleteOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(AUTO_COMPLETE_HOURS);

        List<OrderJpaEntity> expiredOrders = orderJpaRepository
                .findByStatusAndUpdatedAtBefore("ACCEPTED", threshold);

        if (expiredOrders.isEmpty()) return;

        for (OrderJpaEntity order : expiredOrders) {
            order.updateStatus("COMPLETED");
            log.info("[자동 완료] 주문 {} → COMPLETED (접수 후 {}시간 경과)",
                    order.getOrderNumber(), AUTO_COMPLETE_HOURS);
        }

        orderJpaRepository.saveAll(expiredOrders);
        log.info("[자동 완료] 총 {}건 배송완료 처리", expiredOrders.size());
    }
}
