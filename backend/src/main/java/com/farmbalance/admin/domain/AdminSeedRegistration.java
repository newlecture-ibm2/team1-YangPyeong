package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 종자 등록 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-002 농부 승인 시 종자 등록 내역 확인
 * ADM-011 관리자 대시보드: 종자 구매량 통계
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminSeedRegistration {

    private Long id;
    private Long farmId;
    private Long cropId;
    private String seedType;
    private Integer quantity;
    private BigDecimal estimatedYield;
    private String yieldUnit;
    private String receiptImageUrl;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
