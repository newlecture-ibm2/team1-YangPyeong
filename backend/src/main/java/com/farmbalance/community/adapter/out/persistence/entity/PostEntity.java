package com.farmbalance.community.adapter.out.persistence.entity;

import com.farmbalance.community.domain.model.Post;
import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PostEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private PostCategoryEntity category;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "view_count")
    @Builder.Default
    private int viewCount = 0;

    @Column(name = "is_notice")
    @Builder.Default
    private boolean isNotice = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_hidden")
    @Builder.Default
    private boolean isHidden = false;

    @Column(name = "status_reason", length = 500)
    private String statusReason;

    public Post toDomain() {
        return Post.builder()
                .id(this.id)
                .authorId(this.authorId)
                .categoryId(this.category.getId())
                .title(this.title)
                .content(this.content)
                .viewCount(this.viewCount)
                .isNotice(this.isNotice)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .deletedAt(this.deletedAt)
                .isHidden(this.isHidden)
                .statusReason(this.statusReason)
                .build();
    }

    public static PostEntity fromDomain(Post post, PostCategoryEntity category) {
        PostEntity entity = PostEntity.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .category(category)
                .title(post.getTitle())
                .content(post.getContent())
                .viewCount(post.getViewCount())
                .isNotice(post.isNotice())
                .deletedAt(post.getDeletedAt())
                .isHidden(post.isHidden())
                .statusReason(post.getStatusReason())
                .build();
        
        if (post.getCreatedAt() != null) {
            entity.setCreatedAt(post.getCreatedAt());
        }
        
        return entity;
    }
}
