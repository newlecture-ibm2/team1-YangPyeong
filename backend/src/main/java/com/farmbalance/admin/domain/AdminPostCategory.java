package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 게시판 카테고리 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-008 커뮤니티 관리에서 게시판 카테고리 분류용으로 사용
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminPostCategory {

    private Long id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
