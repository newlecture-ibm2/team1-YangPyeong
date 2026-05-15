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
    private final String title;
    private final String category;
    private final String organization;
    private final String regionCode;
    private final String regionName;
    private final String contentSummary;
    private final String sourceUrl;
    private final LocalDateTime fetchedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime deletedAt;

    public static AdminPolicyDataDto from(PolicyData domain, String regionName) {
        return AdminPolicyDataDto.builder()
                .id(domain.getId())
                .externalId(domain.getExternalId())
                .title(domain.getTitle())
                .category(domain.getCategory())
                .organization(domain.getOrganization())
                .regionCode(domain.getRegionCode())
                .regionName(regionName)
                .contentSummary(domain.getContentSummary())
                .sourceUrl(domain.getSourceUrl())
                .fetchedAt(domain.getFetchedAt())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .deletedAt(domain.getDeletedAt())
                .build();
    }
}
