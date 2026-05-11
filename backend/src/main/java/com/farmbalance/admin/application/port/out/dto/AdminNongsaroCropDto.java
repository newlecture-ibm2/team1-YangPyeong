package com.farmbalance.admin.application.port.out.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminNongsaroCropDto {
    private String cropName;
    private String externalId;
}
