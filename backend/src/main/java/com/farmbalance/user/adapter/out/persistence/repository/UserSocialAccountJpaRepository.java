package com.farmbalance.user.adapter.out.persistence.repository;

import com.farmbalance.user.adapter.out.persistence.entity.UserSocialAccountJpaEntity;
import com.farmbalance.user.domain.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 소셜 계정 연동 JPA 리포지토리
 */
public interface UserSocialAccountJpaRepository extends JpaRepository<UserSocialAccountJpaEntity, Long> {

    Optional<UserSocialAccountJpaEntity> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByUserIdAndProvider(Long userId, AuthProvider provider);
}
