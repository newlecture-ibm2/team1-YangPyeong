package com.farmbalance.admin.adapter.in.web.dto;

import com.farmbalance.policy.domain.model.PolicyData;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 관리자용 정책 데이터 응답 DTO
 * Domain → Response 변환은 Controller(adapter/in/web)에서만 수행합니다.
 * 프론트엔드 AdminPolicyData 타입과 필드명을 일치시킵니다.
 */
@Getter
@Builder
public class AdminPolicyDataResponse {

    private final Long id;
    private final String externalId;
    private final String data;
    private final LocalDateTime fetchedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime deletedAt;

    /**
     * PolicyData 도메인 객체 → 관리자 응답 DTO 변환
     * PolicyData.rawData → AdminPolicyDataResponse.data 매핑
     */
    public static AdminPolicyDataResponse from(PolicyData domain) {
        return AdminPolicyDataResponse.builder()
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
