package com.farmbalance.admin.application.port.in.dto;

import com.farmbalance.user.domain.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminUserDto {
    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final String role;
    private final String status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime deletedAt;

    public static AdminUserDto from(User domain) {
        return AdminUserDto.builder()
                .id(domain.getId())
                .email(domain.getEmail())
                .name(domain.getName())
                .phone(domain.getPhone())
                .role(domain.getRole() != null ? domain.getRole().name() : null)
                .status(domain.getStatus() != null ? domain.getStatus().name() : null)
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .deletedAt(domain.getWithdrawalRequestedAt())
                .build();
    }
}
