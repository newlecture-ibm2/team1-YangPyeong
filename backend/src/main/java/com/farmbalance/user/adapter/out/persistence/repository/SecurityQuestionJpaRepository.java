package com.farmbalance.user.adapter.out.persistence.repository;

import com.farmbalance.user.adapter.out.persistence.entity.SecurityQuestionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 보안질문 Spring Data JPA 리포지토리
 */
public interface SecurityQuestionJpaRepository extends JpaRepository<SecurityQuestionJpaEntity, Long> {

    Optional<SecurityQuestionJpaEntity> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    void deleteByUserId(Long userId);
}
