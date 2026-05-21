package com.farmbalance.admin.adapter.in.web.dto;

import com.farmbalance.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 관리자용 사용자 응답 DTO
 * Domain → Response 변환은 Controller(adapter/in/web)에서만 수행합니다.
 * password, provider 등 민감 정보는 노출하지 않습니다.
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class AdminUserResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final String role;
    private final String status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime deletedAt;

    /**
     * User 도메인 객체 → 관리자 응답 DTO 변환
     */
    public static AdminUserResponse from(User domain) {
        return AdminUserResponse.builder()
                .id(domain.getId())
                .email(domain.getEmail())
                .name(domain.getName())
                .phone(domain.getPhone())
                .role(domain.getRole() != null ? domain.getRole().name() : null)
                .status(domain.getStatus() != null ? domain.getStatus().name() : null)
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .deletedAt(null)
                .build();
    }
}
