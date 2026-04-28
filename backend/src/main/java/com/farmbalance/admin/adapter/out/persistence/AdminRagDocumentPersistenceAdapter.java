package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.adapter.out.persistence.entity.RagDocumentJpaEntity;
import com.farmbalance.admin.adapter.out.persistence.repository.RagDocumentJpaRepository;
import com.farmbalance.admin.application.port.out.AdminRagDocumentPort;
import com.farmbalance.admin.domain.RagDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * RAG 문서 Persistence Adapter (Admin 전용 테이블 — JPA 사용)
 */
@Component
@RequiredArgsConstructor
public class AdminRagDocumentPersistenceAdapter implements AdminRagDocumentPort {

    private final RagDocumentJpaRepository ragDocumentJpaRepository;

    @Override
    public List<RagDocument> findAll() {
        return ragDocumentJpaRepository.findAll().stream()
                .map(RagDocumentJpaEntity::toDomain)
                .toList();
    }

    @Override
    public List<RagDocument> findByCategoryId(Long categoryId) {
        return ragDocumentJpaRepository.findByCategoryId(categoryId).stream()
                .map(RagDocumentJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<RagDocument> findById(Long id) {
        return ragDocumentJpaRepository.findById(id)
                .map(RagDocumentJpaEntity::toDomain);
    }

    @Override
    public Long save(RagDocument document) {
        RagDocumentJpaEntity entity = RagDocumentJpaEntity.fromDomain(document);
        return ragDocumentJpaRepository.save(entity).getId();
    }

    @Override
    public void update(RagDocument document) {
        RagDocumentJpaEntity entity = RagDocumentJpaEntity.fromDomain(document);
        ragDocumentJpaRepository.save(entity);
    }

    @Override
    public void delete(Long id) {
        ragDocumentJpaRepository.deleteById(id);
    }
}
