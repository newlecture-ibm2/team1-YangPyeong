package com.farmbalance.notification.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.application.port.out.NotificationPort;
import com.farmbalance.notification.domain.Notification;
import com.farmbalance.notification.domain.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 알림 서비스 — UseCase 구현체.
 * 알림 생성 시 DB 이력을 저장합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService implements NotificationUseCase {

    private final NotificationPort notificationPort;
    private final FcmNotificationService fcmNotificationService;

    @Override
    public Page<Notification> getNotifications(Long userId, String type, Boolean isRead, Pageable pageable) {
        return notificationPort.findByUserIdAndFilters(userId, type, isRead, pageable);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationPort.countUnreadByUserId(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationPort.findActiveById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        // 본인의 알림만 읽음 처리 가능
        if (!notification.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        notification.markAsRead();
        notificationPort.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationPort.markAllAsReadByUserId(userId);
    }

    @Override
    @Transactional
    public Notification createNotification(Long userId, NotificationType type,
                                            String title, String message, String link) {
        Notification notification = Notification.create(userId, type, title, message, link);
        Notification saved = notificationPort.save(notification);
        
        // FCM 푸시 알림 발송 (비동기)
        fcmNotificationService.sendToUser(userId, title, message, link);
        
        log.info("[알림 생성] userId={}, type={}, title={}", userId, type, title);
        return saved;
    }

    @Override
    @Transactional
    public void createBulkNotifications(List<Long> userIds, NotificationType type,
                                         String title, String message, String link) {
        for (Long userId : userIds) {
            Notification notification = Notification.create(userId, type, title, message, link);
            notificationPort.save(notification);
            
            // 일괄 발송 시에도 FCM 발송 (비동기)
            fcmNotificationService.sendToUser(userId, title, message, link);
        }
        log.info("[알림 벌크 생성] {}명에게 {} 타입 알림 발송 완료", userIds.size(), type);
    }
}
