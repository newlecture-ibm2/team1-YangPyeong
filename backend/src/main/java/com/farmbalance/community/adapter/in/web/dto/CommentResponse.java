package com.farmbalance.community.adapter.in.web.dto;

import com.farmbalance.community.domain.model.Comment;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long postId;
    private Long authorId;
    private String content;
    private boolean accepted;
    private String authorNickname;
    private String authorStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse fromDomain(Comment comment, String authorNickname, String authorStatus) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .authorId(comment.getAuthorId())
                .authorNickname(authorNickname)
                .authorStatus(authorStatus)
                .content(comment.getContent())
                .accepted(comment.isAccepted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
