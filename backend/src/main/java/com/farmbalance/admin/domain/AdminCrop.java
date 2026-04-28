package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 작물 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-003 작물 마스터 관리: 등록/수정/비활성화, 밸런스 재계산 트리거
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminCrop {

    private Long id;
    private Long categoryId;
    private String code;
    private String name;
    private Integer growthDays;
    private BigDecimal yieldPerSqm;
    private BigDecimal avgCostPerSqm;
    private String climateConditions;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
