package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.RagDocument;

import java.util.List;
import java.util.Optional;

/**
 * RAG 문서 관리용 Output Port (Admin 전용 테이블)
 */
public interface AdminRagDocumentPort {

    List<RagDocument> findAll();

    List<RagDocument> findByCategoryId(Long categoryId);

    Optional<RagDocument> findById(Long id);

    Long save(RagDocument document);

    void update(RagDocument document);

    void delete(Long id);
}
