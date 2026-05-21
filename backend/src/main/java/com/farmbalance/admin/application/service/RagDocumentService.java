package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageRagDocumentUseCase;
import com.farmbalance.admin.application.port.out.AdminRagDocumentPort;
import com.farmbalance.admin.domain.RagContentType;
import com.farmbalance.admin.domain.RagDocument;
import com.farmbalance.admin.domain.RagDocumentStatus;
import com.farmbalance.admin.domain.RagFileType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RAG 문서 관리 서비스 (UseCase 구현체)
 * 도메인 객체만 사용하며, DTO나 JPA Entity에 직접 의존하지 않습니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RagDocumentService implements ManageRagDocumentUseCase {

    private final AdminRagDocumentPort adminRagDocumentPort;
    private final com.farmbalance.admin.application.port.out.AdminAiPort adminAiPort;

    @Override
    public List<RagDocument> getAllDocuments() {
        return adminRagDocumentPort.findAll();
    }

    @Override
    public List<RagDocument> getDocumentsByCategoryId(Long categoryId) {
        return adminRagDocumentPort.findByCategoryId(categoryId);
    }

    @Override
    public RagDocument getDocumentById(Long id) {
        return adminRagDocumentPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RAG 문서를 찾을 수 없습니다. id=" + id));
    }

    @Override
    @Transactional
    public Long createDocument(Long userId, Long categoryId, String title, String contentType,
                               String textContent, String fileUrl, String fileName, String fileType) {
        RagDocument document = RagDocument.builder()
                .userId(userId)
                .categoryId(categoryId)
                .title(title)
                .contentType(RagContentType.valueOf(contentType))
                .textContent(textContent)
                .fileUrl(fileUrl)
                .fileName(fileName)
                .fileType(fileType != null ? RagFileType.valueOf(fileType) : null)
                .status(RagDocumentStatus.ACTIVE)
                .build();
        return adminRagDocumentPort.save(document);
    }

    @Override
    @Transactional
    public void updateDocument(Long id, Long categoryId, String title, String contentType,
                               String textContent, String fileUrl, String fileName, String fileType) {
        RagDocument existing = getDocumentById(id);

        RagDocument updated = RagDocument.builder()
                .id(existing.getId())
                .userId(existing.getUserId())
                .categoryId(categoryId != null ? categoryId : existing.getCategoryId())
                .title(title != null ? title : existing.getTitle())
                .contentType(contentType != null ? RagContentType.valueOf(contentType) : existing.getContentType())
                .textContent(textContent != null ? textContent : existing.getTextContent())
                .fileUrl(fileUrl != null ? fileUrl : existing.getFileUrl())
                .fileName(fileName != null ? fileName : existing.getFileName())
                .fileType(fileType != null ? RagFileType.valueOf(fileType) : existing.getFileType())
                .status(existing.getStatus())
                .build();

        adminRagDocumentPort.update(updated);
    }

    @Override
    @Transactional
    public void deleteDocument(Long id) {
        getDocumentById(id);
        adminRagDocumentPort.delete(id);
    }

    @Override
    public boolean syncRagData() {
        return adminAiPort.syncRagData();
    }
}
