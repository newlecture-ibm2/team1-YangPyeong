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
    private String region;
    private UserStatus status;
    private AuthProvider provider;
    private String providerId;
    private String profileImageUrl;
    private String address;
    private String bio;
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
                .address(this.address)
                .bio(this.bio)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }

    public void updateRole(Role role) {
        this.role = role;
    }

    /** 프로필 정보를 업데이트합니다. */
    public void updateProfile(String name, String phone, String region, String address, String bio) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        this.phone = phone;
        this.region = region;
        this.address = address;
        this.bio = bio;
        this.updatedAt = LocalDateTime.now();
    }

    /** 프로필 이미지 URL을 업데이트합니다. */
    public void updateProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
        this.updatedAt = LocalDateTime.now();
    }

    /** 비밀번호를 변경합니다. (이미 인코딩된 비밀번호) */
    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
        this.updatedAt = LocalDateTime.now();
    }

    /** 계정을 탈퇴 처리합니다. (Soft Delete) */
    public void withdraw() {
        this.status = UserStatus.WITHDRAWN;
        this.updatedAt = LocalDateTime.now();
    }

    /** 탈퇴된 계정을 다시 활성화합니다. */
    public void reactivate() {
        this.status = UserStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }
}
