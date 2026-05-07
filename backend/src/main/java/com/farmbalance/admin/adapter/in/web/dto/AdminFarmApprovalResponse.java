package com.farmbalance.admin.adapter.in.web.dto;

import com.farmbalance.farm.domain.Farm;
import com.farmbalance.user.domain.User;
import lombok.Builder;
import lombok.Getter;

/**
 * ADM-002 농장 승인 요청 목록 Response DTO
 * FarmApprovalView(admin.domain) 대체 — farms + users 정보를 하나의 DTO로 조합
 */
@Getter
@Builder
public class AdminFarmApprovalResponse {

    // ── 농장 정보 ──
    private Long farmId;
    private String farmName;
    private String address;
    private Double areaSize;
    private java.util.List<com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto> documents;
    private String status;
    private String createdAt;

    // ── 신청자 정보 ──
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;

    /**
     * Farm 도메인 + User 도메인 → Response DTO 변환
     */
    public static AdminFarmApprovalResponse from(Farm farm, User user) {
        return AdminFarmApprovalResponse.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .address(farm.getAddress())
                .areaSize(farm.getArea())
                .documents(farm.getDocuments() != null ?
                        farm.getDocuments().stream().map(com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto::from).collect(java.util.stream.Collectors.toList()) : null)
                .status(farm.getCertificationStatus() != null
                        ? farm.getCertificationStatus().name() : "PENDING")
                .createdAt(farm.getCreatedAt() != null
                        ? farm.getCreatedAt().toString() : null)
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getName() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .userPhone(user != null ? user.getPhone() : null)
                .build();
    }
}
