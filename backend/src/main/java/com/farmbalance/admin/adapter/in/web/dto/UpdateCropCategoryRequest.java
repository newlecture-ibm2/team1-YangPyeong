package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 작물 카테고리 수정 요청 DTO
 */
@Getter
@NoArgsConstructor
public class UpdateCropCategoryRequest {

    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
}
