package com.farmbalance.community.adapter.in.web.dto;

import com.farmbalance.community.domain.model.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyCommentActivityResponse {
    private Long commentId;
    private Long postId;
    private String postTitle;
    private String content;
    private boolean accepted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MyCommentActivityResponse of(Comment comment, String postTitle) {
        return MyCommentActivityResponse.builder()
                .commentId(comment.getId())
                .postId(comment.getPostId())
                .postTitle(postTitle)
                .content(comment.getContent())
                .accepted(comment.isAccepted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
