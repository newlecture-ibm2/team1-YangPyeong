package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 수급 데이터 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-005 밸런스 엔진 관리: 임계치/가중치/주기 조정
 * ADM-011 관리자 대시보드: 수급 통계 조회
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminBalanceData {

    private Long id;
    private String regionCode;
    private Long cropId;
    private Integer year;
    private String season;
    private BigDecimal supplyForecast;
    private BigDecimal demandForecast;
    private BigDecimal supplyRatio;
    private String balanceStatus;
    private LocalDateTime calculatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
