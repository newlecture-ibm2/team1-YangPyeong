package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * RAG 문서 도메인 모델 (순수 Java — Framework 의존성 없음)
 * AI 챗봇(RAG)에 인제스트할 소스 문서를 관리합니다.
 * 관리자가 파일(PDF 등)을 업로드하거나 텍스트를 직접 입력하여 RAG 벡터 DB의 원본 데이터를 CRUD합니다.
 */
@Getter
@Builder
@AllArgsConstructor
public class RagDocument {

    private Long id;
    private Long userId;
    private Long categoryId;
    private String title;
    private RagContentType contentType;
    private String textContent;
    private String fileUrl;
    private String fileName;
    private RagFileType fileType;
    private RagDocumentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
