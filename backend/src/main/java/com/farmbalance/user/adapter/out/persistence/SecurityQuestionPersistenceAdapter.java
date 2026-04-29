package com.farmbalance.user.adapter.out.persistence;

import com.farmbalance.user.adapter.out.persistence.entity.SecurityQuestionJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.SecurityQuestionJpaRepository;
import com.farmbalance.user.application.port.out.SecurityQuestionRepository;
import com.farmbalance.user.domain.SecurityQuestion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 보안질문 Persistence Adapter
 * Output Port(SecurityQuestionRepository)를 구현하여 JPA와 연결합니다.
 */
@Component
@RequiredArgsConstructor
public class SecurityQuestionPersistenceAdapter implements SecurityQuestionRepository {

    private final SecurityQuestionJpaRepository securityQuestionJpaRepository;

    @Override
    public SecurityQuestion save(SecurityQuestion securityQuestion) {
        SecurityQuestionJpaEntity entity = SecurityQuestionJpaEntity.fromDomain(securityQuestion);
        SecurityQuestionJpaEntity saved = securityQuestionJpaRepository.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<SecurityQuestion> findByUserId(Long userId) {
        return securityQuestionJpaRepository.findByUserId(userId)
                .map(SecurityQuestionJpaEntity::toDomain);
    }

    @Override
    public boolean existsByUserId(Long userId) {
        return securityQuestionJpaRepository.existsByUserId(userId);
    }
}
