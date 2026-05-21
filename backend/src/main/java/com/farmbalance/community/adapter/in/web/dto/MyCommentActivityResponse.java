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
    @com.fasterxml.jackson.annotation.JsonProperty("isHidden")
    private boolean isHidden;
    private String statusReason;
    private String hiddenMessage;

    public static MyCommentActivityResponse of(Comment comment, String postTitle) {
        String hiddenMessage = comment.isHidden() ? "💡 복구를 원하시면 고객센터로 문의해 주세요. (이 게시물은 30일 후에 자동 삭제됩니다.)" : null;

        return MyCommentActivityResponse.builder()
                .commentId(comment.getId())
                .postId(comment.getPostId())
                .postTitle(postTitle)
                .content(comment.getContent())
                .accepted(comment.isAccepted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isHidden(comment.isHidden())
                .statusReason(comment.getStatusReason())
                .hiddenMessage(hiddenMessage)
                .build();
    }
}
