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

    /** 비밀번호만 변경한 새 User 인스턴스를 반환합니다. (불변 패턴) */
    public User withPassword(String newPassword) {
        return User.builder()
                .id(this.id)
                .email(this.email)
                .password(newPassword)
                .name(this.name)
                .phone(this.phone)
                .role(this.role)
                .status(this.status)
                .provider(this.provider)
                .providerId(this.providerId)
                .profileImageUrl(this.profileImageUrl)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }
}
