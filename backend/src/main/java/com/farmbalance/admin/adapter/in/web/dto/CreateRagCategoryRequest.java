package com.farmbalance.admin.adapter.in.web.dto;

import lombok.*;

/**
 * RAG 카테고리 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateRagCategoryRequest {
    private String name;
    private String description;
    private Integer displayOrder;
}
