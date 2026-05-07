package com.farmbalance.community.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 게시글 도메인 모델
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    private Long id;
    private Long authorId;
    private Long categoryId;
    private String title;
    private String content;
    private int viewCount;
    private boolean isNotice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void update(Long categoryId, String title, String content, boolean isNotice) {
        this.categoryId = categoryId;
        this.title = title;
        this.content = content;
        this.isNotice = isNotice;
        this.updatedAt = LocalDateTime.now();
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
