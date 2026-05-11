package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 작물 도메인 모델 (순수 Java — Framework 의존성 없음)
 * crops 테이블: 조회 전용 작물 마스터 데이터
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminCrop {

    private Long id;
    private Long categoryId;
    private String name;
    private String externalId;
    private String dataSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
