package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 작물 등록 요청 DTO (단순화: categoryId + name)
 */
@Getter
@NoArgsConstructor
public class CreateCropRequest {
    private Long categoryId;
    private String name;
}
