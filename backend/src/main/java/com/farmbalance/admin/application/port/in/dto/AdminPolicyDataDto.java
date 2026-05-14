package com.farmbalance.admin.application.port.in.dto;

import com.farmbalance.policy.domain.model.PolicyData;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminPolicyDataDto {
    private final Long id;
    private final String externalId;
    private final String data;
    private final LocalDateTime fetchedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime deletedAt;

    public static AdminPolicyDataDto from(PolicyData domain) {
        return AdminPolicyDataDto.builder()
                .id(domain.getId())
                .externalId(domain.getExternalId())
                .data(domain.getRawData())
                .fetchedAt(domain.getFetchedAt())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .deletedAt(domain.getDeletedAt())
                .build();
    }
}
