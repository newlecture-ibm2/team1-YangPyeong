package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 게시글 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-008 커뮤니티 관리: 삭제, 공지 지정, 신고 처리
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminPost {

    private Long id;
    private Long authorId;
    private Long categoryId;
    private String title;
    private String content;
    private Integer viewCount;
    private Boolean isNotice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private boolean isHidden;
    private String statusReason;
}
