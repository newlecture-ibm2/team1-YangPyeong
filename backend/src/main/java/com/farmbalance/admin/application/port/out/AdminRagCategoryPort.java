package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.RagCategory;

import java.util.List;
import java.util.Optional;

/**
 * RAG 카테고리 관리용 Output Port (Admin 전용 테이블)
 */
public interface AdminRagCategoryPort {

    List<RagCategory> findAll();

    Optional<RagCategory> findById(Long id);

    Long save(RagCategory category);

    void update(RagCategory category);

    void delete(Long id);
}
