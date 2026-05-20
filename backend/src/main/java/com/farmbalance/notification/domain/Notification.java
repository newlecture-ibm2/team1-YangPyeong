package com.farmbalance.notification.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 알림 도메인 모델 (순수 POJO — Spring 어노테이션 사용 금지)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private Long id;
    private Long userId;
    private NotificationType type;
    private NotificationCategory category;
    private String title;
    private String message;
    private String link;
    private boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    /**
     * 새 알림을 생성하는 팩토리 메서드
     */
    public static Notification create(Long userId, NotificationType type, NotificationCategory category,
                                       String title, String message, String link) {
        return Notification.builder()
                .userId(userId)
                .type(type)
                .category(category)
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();
    }

    /** 알림을 읽음 처리합니다. */
    public void markAsRead() {
        this.isRead = true;
        this.updatedAt = LocalDateTime.now();
    }

    /** 알림을 소프트 삭제합니다. */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
