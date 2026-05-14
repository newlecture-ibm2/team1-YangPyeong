package com.farmbalance.admin.application.port.out.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminNongsaroCropGroupDto {
    private String categoryName;
    private String externalId;
    private Integer sortOrder;
}
