package com.farmbalance.notification.application.port.out;

import com.farmbalance.notification.domain.NotificationPreference;

import java.util.Optional;

public interface NotificationPreferencePort {
    Optional<NotificationPreference> findByUserId(Long userId);
    NotificationPreference save(NotificationPreference preference);
}
