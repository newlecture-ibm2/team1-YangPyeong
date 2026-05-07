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

    /** 닉네임 중복 검사 (특정 이메일 제외 — 프로필 수정 시 자기 자신 제외용) */
    boolean existsByNameAndEmailNot(String name, String email);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM UserJpaEntity u WHERE u.email = :email")
    void deleteByEmail(@Param("email") String email);
}
