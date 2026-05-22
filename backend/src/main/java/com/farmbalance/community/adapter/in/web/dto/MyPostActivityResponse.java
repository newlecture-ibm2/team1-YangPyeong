package com.farmbalance.community.adapter.in.web.dto;

import com.farmbalance.community.domain.model.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPostActivityResponse {
    private Long postId;
    private Long categoryId;
    private String categoryName;
    private String title;
    private int viewCount;
    private int commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @com.fasterxml.jackson.annotation.JsonProperty("isHidden")
    private boolean isHidden;
    private String statusReason;
    private String hiddenMessage;

    public static MyPostActivityResponse of(Post post, String categoryName, int commentCount) {
        String hiddenMessage = post.isHidden() ? "💡 복구를 원하시면 고객센터로 문의해 주세요. (이 게시물은 30일 후에 자동 삭제됩니다.)" : null;

        return MyPostActivityResponse.builder()
                .postId(post.getId())
                .categoryId(post.getCategoryId())
                .categoryName(categoryName)
                .title(post.getTitle())
                .viewCount(post.getViewCount())
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .isHidden(post.isHidden())
                .statusReason(post.getStatusReason())
                .hiddenMessage(hiddenMessage)
                .build();
    }
}
