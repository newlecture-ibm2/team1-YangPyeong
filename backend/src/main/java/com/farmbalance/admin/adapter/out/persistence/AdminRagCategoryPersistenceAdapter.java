package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.adapter.out.persistence.entity.RagCategoryJpaEntity;
import com.farmbalance.admin.adapter.out.persistence.repository.RagCategoryJpaRepository;
import com.farmbalance.admin.application.port.out.AdminRagCategoryPort;
import com.farmbalance.admin.domain.RagCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * RAG 카테고리 Persistence Adapter (Admin 전용 테이블 — JPA 사용)
 */
@Component
@RequiredArgsConstructor
public class AdminRagCategoryPersistenceAdapter implements AdminRagCategoryPort {

    private final RagCategoryJpaRepository ragCategoryJpaRepository;

    @Override
    public List<RagCategory> findAll() {
        return ragCategoryJpaRepository.findAll().stream()
                .map(RagCategoryJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<RagCategory> findById(Long id) {
        return ragCategoryJpaRepository.findById(id)
                .map(RagCategoryJpaEntity::toDomain);
    }

    @Override
    public Long save(RagCategory category) {
        RagCategoryJpaEntity entity = RagCategoryJpaEntity.fromDomain(category);
        return ragCategoryJpaRepository.save(entity).getId();
    }

    @Override
    public void update(RagCategory category) {
        RagCategoryJpaEntity entity = RagCategoryJpaEntity.fromDomain(category);
        ragCategoryJpaRepository.save(entity);
    }

    @Override
    public void delete(Long id) {
        ragCategoryJpaRepository.deleteById(id);
    }
}
