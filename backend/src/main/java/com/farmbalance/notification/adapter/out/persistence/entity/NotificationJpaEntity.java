package com.farmbalance.notification.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import com.farmbalance.notification.domain.Notification;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 알림 JPA 엔티티 — notifications 테이블 매핑
 */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class NotificationJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(length = 30)
    private String category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 500)
    private String link;

    @Column(name = "is_read")
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** JPA Entity → Domain 변환 */
    public Notification toDomain() {
        return Notification.builder()
                .id(this.id)
                .userId(this.userId)
                .type(NotificationType.valueOf(this.type))
                .category(this.category != null ? NotificationCategory.valueOf(this.category) : null)
                .title(this.title)
                .message(this.message)
                .link(this.link)
                .isRead(this.isRead)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .deletedAt(this.deletedAt)
                .build();
    }

    /** Domain → JPA Entity 변환 */
    public static NotificationJpaEntity fromDomain(Notification notification) {
        NotificationJpaEntity entity = NotificationJpaEntity.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType().name())
                .category(notification.getCategory() != null ? notification.getCategory().name() : null)
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.isRead())
                .deletedAt(notification.getDeletedAt())
                .build();

        if (notification.getCreatedAt() != null) {
            entity.setCreatedAt(notification.getCreatedAt());
        }

        return entity;
    }

    /** 더티 체킹을 위한 상태 업데이트 */
    public void updateFromDomain(Notification notification) {
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.link = notification.getLink();
        this.isRead = notification.isRead();
        this.deletedAt = notification.getDeletedAt();
    }
}
