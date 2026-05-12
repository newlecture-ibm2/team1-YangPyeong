package com.farmbalance.notification.adapter.out.persistence;

import com.farmbalance.notification.adapter.out.persistence.entity.NotificationJpaEntity;
import com.farmbalance.notification.adapter.out.persistence.repository.NotificationJpaRepository;
import com.farmbalance.notification.application.port.out.NotificationPort;
import com.farmbalance.notification.domain.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 알림 Persistence Adapter — JPA를 사용한 Output Port 구현체
 */
@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements NotificationPort {

    private final NotificationJpaRepository notificationJpaRepository;

    @Override
    public Notification save(Notification notification) {
        NotificationJpaEntity entity = NotificationJpaEntity.fromDomain(notification);
        return notificationJpaRepository.save(entity).toDomain();
    }

    @Override
    public List<Notification> saveAll(List<Notification> notifications) {
        List<NotificationJpaEntity> entities = notifications.stream()
                .map(NotificationJpaEntity::fromDomain)
                .toList();
        return notificationJpaRepository.saveAll(entities).stream()
                .map(NotificationJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<Notification> findActiveById(Long id) {
        return notificationJpaRepository.findActiveById(id)
                .map(NotificationJpaEntity::toDomain);
    }

    @Override
    public Page<Notification> findByUserIdAndFilters(Long userId, String type, Boolean isRead, Pageable pageable) {
        return notificationJpaRepository.findByUserIdAndFilters(userId, type, isRead, pageable)
                .map(NotificationJpaEntity::toDomain);
    }

    @Override
    public long countUnreadByUserId(Long userId) {
        return notificationJpaRepository.countUnreadByUserId(userId);
    }

    @Override
    public void markAllAsReadByUserId(Long userId) {
        notificationJpaRepository.markAllAsReadByUserId(userId);
    }
}
