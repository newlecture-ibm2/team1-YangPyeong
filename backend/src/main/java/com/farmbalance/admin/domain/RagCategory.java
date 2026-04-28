package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * RAG 카테고리 도메인 모델 (순수 Java — Framework 의존성 없음)
 * 정책, 병해충, 재배기술, 매뉴얼 등 RAG 문서를 분류하는 카테고리입니다.
 */
@Getter
@Builder
@AllArgsConstructor
public class RagCategory {

    private Long id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
