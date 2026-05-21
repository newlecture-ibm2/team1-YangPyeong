package com.farmbalance.notification.adapter.out.persistence;

import com.farmbalance.notification.adapter.out.persistence.entity.NotificationPreferenceJpaEntity;
import com.farmbalance.notification.adapter.out.persistence.repository.NotificationPreferenceJpaRepository;
import com.farmbalance.notification.application.port.out.NotificationPreferencePort;
import com.farmbalance.notification.domain.NotificationPreference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class NotificationPreferencePersistenceAdapter implements NotificationPreferencePort {

    private final NotificationPreferenceJpaRepository repository;

    @Override
    public Optional<NotificationPreference> findByUserId(Long userId) {
        return repository.findByUserId(userId)
                .map(NotificationPreferenceJpaEntity::toDomain);
    }

    @Override
    public List<NotificationPreference> findAllByUserIdIn(List<Long> userIds) {
        return repository.findAllByUserIdIn(userIds).stream()
                .map(NotificationPreferenceJpaEntity::toDomain)
                .toList();
    }

    @Override
    public NotificationPreference save(NotificationPreference preference) {
        if (preference.getId() != null) {
            return repository.findById(preference.getId())
                    .map(entity -> {
                        entity.updateFromDomain(preference);
                        return repository.save(entity).toDomain();
                    })
                    .orElseGet(() -> repository.save(NotificationPreferenceJpaEntity.fromDomain(preference)).toDomain());
        }
        return repository.save(NotificationPreferenceJpaEntity.fromDomain(preference)).toDomain();
    }
}
