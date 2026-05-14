package com.farmbalance.notification.adapter.out.persistence;

import com.farmbalance.notification.adapter.out.persistence.entity.FcmTokenJpaEntity;
import com.farmbalance.notification.adapter.out.persistence.repository.FcmTokenJpaRepository;
import com.farmbalance.notification.application.port.out.FcmTokenPort;
import com.farmbalance.notification.domain.FcmToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class FcmTokenPersistenceAdapter implements FcmTokenPort {

    private final FcmTokenJpaRepository fcmTokenJpaRepository;

    @Override
    public void save(FcmToken fcmToken) {
        FcmTokenJpaEntity entity = FcmTokenJpaEntity.fromDomain(fcmToken);
        fcmTokenJpaRepository.save(entity);
    }

    @Override
    public void updateTimestamp(Long id) {
        fcmTokenJpaRepository.findById(id).ifPresent(entity -> {
            // PreUpdate 트리거를 위해 엔티티 저장
            fcmTokenJpaRepository.save(entity);
        });
    }

    @Override
    public void deleteByUserIdAndToken(Long userId, String token) {
        fcmTokenJpaRepository.findByUserIdAndToken(userId, token)
                .ifPresent(fcmTokenJpaRepository::delete);
    }

    @Override
    public Optional<FcmToken> findByUserIdAndToken(Long userId, String token) {
        return fcmTokenJpaRepository.findByUserIdAndToken(userId, token)
                .map(FcmTokenJpaEntity::toDomain);
    }

    @Override
    public List<FcmToken> findByUserId(Long userId) {
        return fcmTokenJpaRepository.findByUserId(userId).stream()
                .map(FcmTokenJpaEntity::toDomain)
                .collect(Collectors.toList());
    }
}
