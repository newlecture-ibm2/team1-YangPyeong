package com.farmbalance.user.adapter.out.persistence.repository;

import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import com.farmbalance.user.domain.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Spring Data JPA 리포지토리
 */
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, Long> {

    Optional<UserJpaEntity> findByEmail(String email);

    Optional<UserJpaEntity> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByEmail(String email);

    boolean existsByName(String name);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM UserJpaEntity u WHERE u.email = :email")
    void deleteByEmail(@Param("email") String email);
}
