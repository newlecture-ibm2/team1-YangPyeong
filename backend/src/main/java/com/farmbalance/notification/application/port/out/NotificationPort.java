package com.farmbalance.notification.application.port.out;

import com.farmbalance.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * 알림 Driven Adapter 인터페이스 (Output Port)
 */
public interface NotificationPort {
    Notification save(Notification notification);
    List<Notification> saveAll(List<Notification> notifications);
    Optional<Notification> findActiveById(Long id);
    Page<Notification> findByUserIdAndFilters(Long userId, String type, Boolean isRead, Pageable pageable);
    long countUnreadByUserId(Long userId);
    void markAllAsReadByUserId(Long userId);
}
