package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 주문 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-009 상점 관리: 주문 조회, 분쟁 처리
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminOrder {

    private Long id;
    private Long buyerId;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String status;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String shippingMemo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
