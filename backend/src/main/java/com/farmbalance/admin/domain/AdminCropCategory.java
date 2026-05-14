package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 작물 카테고리 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-003 작물 마스터 관리에서 카테고리 분류용으로 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCropCategory {

    private Long id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private String externalId;
    private String dataSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
