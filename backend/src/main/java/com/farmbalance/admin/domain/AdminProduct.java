package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 상품 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-009 상점 관리: 상품 승인/반려/비활성화
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminProduct {

    private Long id;
    private Long sellerId;
    private Long categoryId;
    private String name;
    private BigDecimal price;
    private Integer stock;
    private String description;
    private String imageUrl;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
