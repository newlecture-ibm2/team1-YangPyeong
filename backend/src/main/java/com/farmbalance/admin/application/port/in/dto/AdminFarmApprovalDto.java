package com.farmbalance.admin.application.port.in.dto;

import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.FarmDocument;
import com.farmbalance.user.domain.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class AdminFarmApprovalDto {

    private Long farmId;
    private String farmName;
    private String address;
    private Double areaSize;
    private List<AdminFarmDocumentDto> documents;
    private com.farmbalance.farm.domain.FarmDocumentData documentData;
    private String status;
    private String createdAt;

    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;

    @Getter
    @Builder
    public static class AdminFarmDocumentDto {
        private String type;
        private String url;
        private String name;

        public static AdminFarmDocumentDto from(FarmDocument document) {
            return AdminFarmDocumentDto.builder()
                    .type(document.getType())
                    .url(document.getUrl())
                    .name(document.getName())
                    .build();
        }
    }

    public static AdminFarmApprovalDto from(Farm farm, User user) {
        return AdminFarmApprovalDto.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .address(farm.getAddress())
                .areaSize(farm.getArea())
                .documents(farm.getDocuments() != null ?
                        farm.getDocuments().stream().map(AdminFarmDocumentDto::from).collect(Collectors.toList()) : null)
                .documentData(farm.getDocumentData())
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
