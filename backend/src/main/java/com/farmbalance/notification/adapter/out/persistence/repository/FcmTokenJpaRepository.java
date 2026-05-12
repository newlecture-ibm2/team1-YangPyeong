package com.farmbalance.notification.adapter.out.persistence.repository;

import com.farmbalance.notification.adapter.out.persistence.entity.FcmTokenJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FcmTokenJpaRepository extends JpaRepository<FcmTokenJpaEntity, Long> {
    Optional<FcmTokenJpaEntity> findByUserIdAndToken(Long userId, String token);
    List<FcmTokenJpaEntity> findByUserId(Long userId);
}
