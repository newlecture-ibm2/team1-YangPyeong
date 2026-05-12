package com.farmbalance.notification.application.port.in;

import com.farmbalance.notification.domain.Notification;
import com.farmbalance.notification.domain.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 알림 Driving Adapter 인터페이스 (Input Port)
 */
public interface NotificationUseCase {
    /** 내 알림 목록 조회 (필터 + 페이징) */
    Page<Notification> getNotifications(Long userId, String type, Boolean isRead, Pageable pageable);

    /** 읽지 않은 알림 수 조회 (헤더 벨 뱃지용) */
    long getUnreadCount(Long userId);

    /** 개별 알림 읽음 처리 */
    void markAsRead(Long notificationId, Long userId);

    /** 전체 알림 읽음 처리 */
    void markAllAsRead(Long userId);

    /** 알림 생성 (내부 서비스에서 호출) */
    Notification createNotification(Long userId, NotificationType type, String title, String message, String link);

    /** 다수 유저에게 알림 일괄 생성 (수급 임계값 초과 시) */
    void createBulkNotifications(List<Long> userIds, NotificationType type, String title, String message, String link);
}
