package com.farmbalance.notification.application.port.out;

import com.farmbalance.notification.domain.NotificationPreference;

import java.util.List;
import java.util.Optional;

public interface NotificationPreferencePort {
    Optional<NotificationPreference> findByUserId(Long userId);
    List<NotificationPreference> findAllByUserIdIn(List<Long> userIds);
    NotificationPreference save(NotificationPreference preference);
}
