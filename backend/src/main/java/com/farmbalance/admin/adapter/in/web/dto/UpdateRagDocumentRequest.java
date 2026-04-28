package com.farmbalance.admin.adapter.in.web.dto;

import lombok.*;

/**
 * RAG 문서 수정 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRagDocumentRequest {
    private Long categoryId;
    private String title;
    private String contentType;
    private String textContent;
    private String fileUrl;
    private String fileName;
    private String fileType;
}
