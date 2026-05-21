package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 댓글 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-008 커뮤니티 관리: 댓글 삭제, 신고 처리
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminComment {

    private Long id;
    private Long postId;
    private String postTitle;
    private Long authorId;
    private String authorNickname;
    private String authorEmail;
    private String content;
    private Boolean accepted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    @com.fasterxml.jackson.annotation.JsonProperty("isHidden")
    private boolean isHidden;
    private String statusReason;
}
