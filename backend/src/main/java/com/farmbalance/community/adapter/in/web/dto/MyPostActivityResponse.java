package com.farmbalance.community.adapter.in.web.dto;

import com.farmbalance.community.domain.model.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyPostActivityResponse {
    private Long postId;
    private Long categoryId;
    private String categoryName;
    private String title;
    private int viewCount;
    private int commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MyPostActivityResponse of(Post post, String categoryName, int commentCount) {
        return MyPostActivityResponse.builder()
                .postId(post.getId())
                .categoryId(post.getCategoryId())
                .categoryName(categoryName)
                .title(post.getTitle())
                .viewCount(post.getViewCount())
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
