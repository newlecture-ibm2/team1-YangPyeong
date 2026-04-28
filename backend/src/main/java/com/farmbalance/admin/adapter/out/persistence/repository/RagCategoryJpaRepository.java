package com.farmbalance.admin.adapter.out.persistence.repository;

import com.farmbalance.admin.adapter.out.persistence.entity.RagCategoryJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RAG 카테고리 JPA Repository (Admin 전용 테이블)
 */
public interface RagCategoryJpaRepository extends JpaRepository<RagCategoryJpaEntity, Long> {
}
