package com.farmbalance.admin.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 작물 수정 요청 DTO (단순화: categoryId + name)
 */
@Getter
@NoArgsConstructor
public class UpdateCropRequest {
    private Long categoryId;
    private String name;
}
