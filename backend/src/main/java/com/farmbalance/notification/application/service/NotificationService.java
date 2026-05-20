package com.farmbalance.notification.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.notification.application.port.in.NotificationPreferenceUseCase;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.application.port.out.NotificationPort;
import com.farmbalance.notification.domain.Notification;
import com.farmbalance.notification.domain.NotificationCategory;
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
    private final NotificationPreferenceUseCase preferenceUseCase;

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
    public Notification createNotification(Long userId, NotificationType type, NotificationCategory category,
                                            String title, String message, String link) {
        // 설정이 비활성화된 경우 DB 저장 및 FCM 모두 스킵
        if (!preferenceUseCase.isEnabled(userId, category)) {
            log.debug("[알림 스킵] userId={}, category={} (사용자 설정 비활성화)", userId, category);
            return Notification.create(userId, type, category, title, message, link);
        }

        Notification saved = notificationPort.save(Notification.create(userId, type, category, title, message, link));
        fcmNotificationService.sendToUser(userId, title, message, link);
        log.info("[알림 생성] userId={}, type={}, category={}, title={}", userId, type, category, title);
        return saved;
    }

    @Override
    @Transactional
    public void createBulkNotifications(List<Long> userIds, NotificationType type, NotificationCategory category,
                                         String title, String message, String link) {
        // 1번의 배치 조회로 활성화된 사용자만 필터링 (N+1 방지)
        List<Long> enabledUserIds = preferenceUseCase.filterEnabledUserIds(userIds, category);

        if (enabledUserIds.isEmpty()) {
            log.info("[알림 벌크 스킵] type={}, category={}, 전체={}명 (모두 수신 거부)", type, category, userIds.size());
            return;
        }

        List<Notification> notifications = enabledUserIds.stream()
                .map(userId -> Notification.create(userId, type, category, title, message, link))
                .toList();
        notificationPort.saveAll(notifications);
        enabledUserIds.forEach(userId -> fcmNotificationService.sendToUser(userId, title, message, link));

        log.info("[알림 벌크 생성] type={}, category={}, 전체={}명 → 발송={}명 ({}명 스킵)",
                type, category, userIds.size(), enabledUserIds.size(), userIds.size() - enabledUserIds.size());
    }
}
