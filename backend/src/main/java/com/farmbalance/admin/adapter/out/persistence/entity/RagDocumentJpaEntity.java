package com.farmbalance.admin.adapter.out.persistence.entity;

import com.farmbalance.admin.domain.*;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * RAG 문서 JPA 엔티티 (Driven Adapter)
 * domain.RagDocument ↔ RagDocumentJpaEntity 변환을 담당합니다.
 *
 * <p>
 * ERD 2.25 rag_documents 테이블에 대응
 * </p>
 * <p>
 * 설계 의도: AI 챗봇(RAG)에 인제스트할 소스 문서를 관리하는 테이블.
 * 관리자가 파일(PDF 등)을 업로드하거나 텍스트를 직접 입력하여
 * RAG 벡터 DB의 원본 데이터를 CRUD 할 수 있습니다.
 * </p>
 */
@Entity
@Table(name = "rag_documents", indexes = {
                @Index(name = "idx_rag_docs_category", columnList = "category_id"),
                @Index(name = "idx_rag_docs_status", columnList = "status"),
                @Index(name = "idx_rag_docs_content_type", columnList = "content_type")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RagDocumentJpaEntity {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false)
        private Long userId;

        @Column(nullable = false)
        private Long categoryId;

        @Column(nullable = false, length = 200)
        private String title;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 10)
        private RagContentType contentType;

        @Column(columnDefinition = "TEXT")
        private String textContent;

        @Column(length = 500)
        private String fileUrl;

        @Column(length = 200)
        private String fileName;

        @Enumerated(EnumType.STRING)
        @Column(length = 10)
        private RagFileType fileType;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 20)
        @Builder.Default
        private RagDocumentStatus status = RagDocumentStatus.ACTIVE;

        @CreatedDate
        @Column(updatable = false)
        private LocalDateTime createdAt;

        @LastModifiedDate
        private LocalDateTime updatedAt;

        private LocalDateTime deletedAt;

        /* ── 도메인 모델 변환 ── */

        public RagDocument toDomain() {
                return RagDocument.builder()
                                .id(id)
                                .userId(userId)
                                .categoryId(categoryId)
                                .title(title)
                                .contentType(contentType)
                                .textContent(textContent)
                                .fileUrl(fileUrl)
                                .fileName(fileName)
                                .fileType(fileType)
                                .status(status)
                                .createdAt(createdAt)
                                .updatedAt(updatedAt)
                                .deletedAt(deletedAt)
                                .build();
        }

        public static RagDocumentJpaEntity fromDomain(RagDocument document) {
                return RagDocumentJpaEntity.builder()
                                .id(document.getId())
                                .userId(document.getUserId())
                                .categoryId(document.getCategoryId())
                                .title(document.getTitle())
                                .contentType(document.getContentType())
                                .textContent(document.getTextContent())
                                .fileUrl(document.getFileUrl())
                                .fileName(document.getFileName())
                                .fileType(document.getFileType())
                                .status(document.getStatus())
                                .build();
        }
}
