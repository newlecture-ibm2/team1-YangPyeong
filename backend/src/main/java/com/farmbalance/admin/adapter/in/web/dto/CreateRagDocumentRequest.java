package com.farmbalance.admin.adapter.in.web.dto;

import lombok.*;

/**
 * RAG 문서 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateRagDocumentRequest {
    private Long categoryId;
    private String title;
    private String contentType;
    private String textContent;
    private String fileUrl;
    private String fileName;
    private String fileType;
}
