package com.farmbalance.community.adapter.out.persistence.entity;

import com.farmbalance.community.domain.model.Comment;
import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CommentEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    @Builder.Default
    private boolean accepted = false;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public Comment toDomain() {
        return Comment.builder()
                .id(this.id)
                .postId(this.post.getId())
                .authorId(this.authorId)
                .content(this.content)
                .accepted(this.accepted)
                .parentId(this.parentId)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .deletedAt(this.deletedAt)
                .build();
    }

    public static CommentEntity fromDomain(Comment comment, PostEntity post) {
        return CommentEntity.builder()
                .id(comment.getId())
                .post(post)
                .authorId(comment.getAuthorId())
                .content(comment.getContent())
                .accepted(comment.isAccepted())
                .parentId(comment.getParentId())
                .deletedAt(comment.getDeletedAt())
                .build();
    }
}
