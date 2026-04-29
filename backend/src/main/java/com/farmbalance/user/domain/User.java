package com.farmbalance.user.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 도메인 모델 (순수 Java — Framework 의존성 없음)
 */
@Getter
@Builder
@AllArgsConstructor
public class User {

    private Long id;
    private String email;
    private String password;
    private String name;
    private String phone;
    private Role role;
    private UserStatus status;
    private AuthProvider provider;
    private String providerId;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateRole(Role role) {
        this.role = role;
    }
}
