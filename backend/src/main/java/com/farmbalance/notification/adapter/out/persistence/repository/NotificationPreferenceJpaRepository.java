package com.farmbalance.notification.adapter.out.persistence.repository;

import com.farmbalance.notification.adapter.out.persistence.entity.NotificationPreferenceJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationPreferenceJpaRepository extends JpaRepository<NotificationPreferenceJpaEntity, Long> {
    Optional<NotificationPreferenceJpaEntity> findByUserId(Long userId);
    List<NotificationPreferenceJpaEntity> findAllByUserIdIn(List<Long> userIds);
}
