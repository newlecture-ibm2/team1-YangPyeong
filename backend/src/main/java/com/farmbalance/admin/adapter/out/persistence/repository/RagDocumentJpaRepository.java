package com.farmbalance.admin.adapter.out.persistence.repository;

import com.farmbalance.admin.adapter.out.persistence.entity.RagDocumentJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * RAG 문서 JPA Repository (Admin 전용 테이블)
 */
public interface RagDocumentJpaRepository extends JpaRepository<RagDocumentJpaEntity, Long> {

    List<RagDocumentJpaEntity> findByCategoryId(Long categoryId);
}
