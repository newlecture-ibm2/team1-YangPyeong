package com.farmbalance.community.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isNotice")
    private boolean isNotice;

    private String authorNickname;
    private String authorStatus;
    private boolean hasAcceptedComment;

    @JsonProperty("isHidden")
    private boolean isHidden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponse fromDomain(Post post, String categoryName, int commentCount, String authorNickname, String authorStatus, boolean hasAcceptedComment) {
        return PostResponse.builder()
                .id(post.getId())
                .categoryId(post.getCategoryId())
                .authorId(post.getAuthorId())
                .authorNickname(authorNickname)
                .authorStatus(authorStatus)
                .hasAcceptedComment(hasAcceptedComment)
                .title(post.getTitle())
                .content(post.getContent())
                .viewCount(post.getViewCount())
                .commentCount(commentCount)
                .categoryName(categoryName)
                .isNotice(post.isNotice())
                .isHidden(post.isHidden())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
