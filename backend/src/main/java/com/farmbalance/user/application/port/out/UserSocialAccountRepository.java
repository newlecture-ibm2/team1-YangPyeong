package com.farmbalance.user.application.port.out;

import com.farmbalance.user.domain.AuthProvider;
import com.farmbalance.user.domain.UserSocialAccount;

import java.util.Optional;

/**
 * 소셜 계정 연동 Output Port
 */
public interface UserSocialAccountRepository {

    UserSocialAccount save(UserSocialAccount account);

    Optional<UserSocialAccount> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByUserIdAndProvider(Long userId, AuthProvider provider);
}
