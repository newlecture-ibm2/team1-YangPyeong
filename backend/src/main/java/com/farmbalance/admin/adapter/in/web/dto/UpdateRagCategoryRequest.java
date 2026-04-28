package com.farmbalance.admin.adapter.in.web.dto;

import lombok.*;

/**
 * RAG 카테고리 수정 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRagCategoryRequest {
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
}
