package com.farmbalance.community.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 댓글 도메인 모델
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    private Long id;
    private Long postId;
    private Long authorId;
    private String content;
    private boolean accepted;
    private Long parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private boolean isHidden;
    private String statusReason;

    public void update(String content) {
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }

    public void accept() {
        this.accepted = true;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    public void hide(String reason) {
        this.isHidden = true;
        this.statusReason = reason;
    }

    public void restoreHidden() {
        this.isHidden = false;
        this.statusReason = null;
    }
}
