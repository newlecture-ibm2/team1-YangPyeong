package com.farmbalance.admin.application.port.out.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNongsaroCropGroupDto {
    private String categoryName;
    private String externalId;
    private Integer sortOrder;
}
