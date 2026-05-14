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
    private Long parentId;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse fromDomain(Comment comment, String authorNickname, String authorStatus) {
        boolean deleted = comment.getDeletedAt() != null;
        
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .authorId(deleted ? null : comment.getAuthorId())
                .authorNickname(deleted ? "(삭제됨)" : authorNickname)
                .authorStatus(deleted ? null : authorStatus)
                .content(deleted ? "삭제된 메시지입니다." : comment.getContent())
                .accepted(comment.isAccepted())
                .parentId(comment.getParentId())
                .isDeleted(deleted)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
