package com.farmbalance.user.adapter.out.persistence;

import com.farmbalance.user.adapter.out.persistence.entity.UserSocialAccountJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserSocialAccountJpaRepository;
import com.farmbalance.user.application.port.out.UserSocialAccountRepository;
import com.farmbalance.user.domain.AuthProvider;
import com.farmbalance.user.domain.UserSocialAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 소셜 계정 연동 Persistence Adapter
 */
@Component
@RequiredArgsConstructor
public class UserSocialAccountPersistenceAdapter implements UserSocialAccountRepository {

    private final UserSocialAccountJpaRepository jpaRepository;

    @Override
    public UserSocialAccount save(UserSocialAccount account) {
        UserSocialAccountJpaEntity entity = UserSocialAccountJpaEntity.fromDomain(account);
        return jpaRepository.save(entity).toDomain();
    }

    @Override
    public Optional<UserSocialAccount> findByProviderAndProviderId(AuthProvider provider, String providerId) {
        return jpaRepository.findByProviderAndProviderId(provider, providerId)
                .map(UserSocialAccountJpaEntity::toDomain);
    }

    @Override
    public boolean existsByUserIdAndProvider(Long userId, AuthProvider provider) {
        return jpaRepository.existsByUserIdAndProvider(userId, provider);
    }
}
