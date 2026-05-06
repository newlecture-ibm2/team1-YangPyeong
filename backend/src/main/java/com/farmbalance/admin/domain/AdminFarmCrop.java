package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 농장-작물 연결 도메인 모델 (순수 Java — Framework 의존성 없음)
 * farm_crops 테이블: 농장별 재배 작물 + 예상 수확량
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminFarmCrop {

    private Long id;
    private Long farmId;
    private Long cropId;
    private BigDecimal estimatedYield;
    private String yieldUnit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
