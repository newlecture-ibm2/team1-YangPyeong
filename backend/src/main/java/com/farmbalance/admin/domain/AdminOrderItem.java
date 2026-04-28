package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 주문 항목 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-009 상점 관리: 주문 상세 조회, 분쟁 처리
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminOrderItem {

    private Long id;
    private Long orderId;
    private Long productId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
