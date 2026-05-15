package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.global.batch.BatchLogService;
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

    private final OrderAutoAdvanceService orderAutoAdvanceService;
    private final BatchLogService batchLogService;

    public OrderAutoCompleteScheduler(OrderAutoAdvanceService orderAutoAdvanceService, BatchLogService batchLogService) {
        this.orderAutoAdvanceService = orderAutoAdvanceService;
        this.batchLogService = batchLogService;
    }

    /**
     * 매 1시간마다 실행.
     * 1) ACCEPTED 상태 + 24시간 경과 → 자동 SHIPPED (더미 송장번호 발급)
     * 2) SHIPPED 상태 + 24시간 경과 → 자동 COMPLETED
     *
     * <p>@Transactional은 실제 DB 변경을 수행하는 외부 Service에 적용하여,
     * BatchLogService의 로그 저장 트랜잭션(REQUIRES_NEW)과 분리합니다.</p>
     */
    @Scheduled(fixedRate = 3600000) // 1시간 = 3,600,000ms
    public void autoAdvanceOrders() {
        batchLogService.execute("ORDER_AUTO_ADVANCE", orderAutoAdvanceService::autoAdvance);
    }

}
