package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 작물 카테고리 등록 요청 DTO
 */
@Getter
@NoArgsConstructor
public class CreateCropCategoryRequest {

    private String name;
    private String description;
    private Integer displayOrder;
}
