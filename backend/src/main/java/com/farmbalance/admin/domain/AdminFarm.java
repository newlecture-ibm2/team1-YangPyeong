package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 농장 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-002 농부 승인/반려: 토지증명서 검토, 농장 등록 승인/반려
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminFarm {

    private Long id;
    private Long userId;
    private String name;
    private String address;
    private String bjdCode;
    private String pnuCode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal areaSize;
    private String soilType;
    private String businessNumber;
    private String landCertImageUrl;
    private Boolean landCertVerified;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
