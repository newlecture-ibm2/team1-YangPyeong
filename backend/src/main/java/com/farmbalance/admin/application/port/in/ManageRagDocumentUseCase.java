package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.RagDocument;

import java.util.List;

/**
 * RAG 문서 관리 UseCase (Input Port)
 */
public interface ManageRagDocumentUseCase {

    List<RagDocument> getAllDocuments();

    List<RagDocument> getDocumentsByCategoryId(Long categoryId);

    RagDocument getDocumentById(Long id);

    Long createDocument(Long userId, Long categoryId, String title, String contentType,
                        String textContent, String fileUrl, String fileName, String fileType);

    void updateDocument(Long id, Long categoryId, String title, String contentType,
                        String textContent, String fileUrl, String fileName, String fileType);

    void deleteDocument(Long id);

    boolean syncRagData();
}
