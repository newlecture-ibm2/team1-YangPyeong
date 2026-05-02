package com.farmbalance.user.application.port.out;

import com.farmbalance.user.domain.User;

import java.util.Optional;

/**
 * 사용자 저장소 Output Port (인터페이스)
 * adapter/out/persistence 에서 구현합니다.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    boolean existsByEmail(String email);

    boolean existsByName(String name);

    void deleteByEmail(String email);
}
