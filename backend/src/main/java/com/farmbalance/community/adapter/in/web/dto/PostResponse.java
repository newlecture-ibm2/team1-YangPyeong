package com.farmbalance.community.adapter.in.web.dto;

import com.farmbalance.community.domain.model.Post;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private Long categoryId;
    private Long authorId;
    private String title;
    private String content;
    private int viewCount;
    private int commentCount;
    private String categoryName;
    private boolean isNotice;
    private String authorNickname;
    private boolean hasAcceptedComment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponse fromDomain(Post post, String categoryName, int commentCount, String authorNickname, boolean hasAcceptedComment) {
        return PostResponse.builder()
                .id(post.getId())
                .categoryId(post.getCategoryId())
                .authorId(post.getAuthorId())
                .authorNickname(authorNickname)
                .hasAcceptedComment(hasAcceptedComment)
                .title(post.getTitle())
                .content(post.getContent())
                .viewCount(post.getViewCount())
                .commentCount(commentCount)
                .categoryName(categoryName)
                .isNotice(post.isNotice())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
