package com.farmbalance.user.domain;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 도메인 모델 (순수 Java — Framework 의존성 없음)
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User {

    private Long id;
    private String email;
    private String password;
    private String name;
    private String phone;
    private Role role;

    private UserStatus status;
    private String statusReason;
    private AuthProvider provider;
    private String providerId;
    private String profileImageUrl;
    private String address;
    private String bio;
    private String regionCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 탈퇴 요청/복구 골든타임 시작 시각 */
    private LocalDateTime withdrawalRequestedAt;

    /** 비식별화(anonymize) 처리 완료 시각 */
    private LocalDateTime anonymizedAt;

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
                .statusReason(this.statusReason)
                .provider(this.provider)
                .providerId(this.providerId)
                .profileImageUrl(this.profileImageUrl)
                .address(this.address)
                .bio(this.bio)
                .regionCode(this.regionCode)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .withdrawalRequestedAt(this.withdrawalRequestedAt)
                .anonymizedAt(this.anonymizedAt)
                .build();
    }

    public void updateRole(Role role) {
        this.role = role;
    }

    /** 프로필 정보를 업데이트합니다. */
    public void updateProfile(String name, String phone, String address, String bio) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        this.phone = phone;
        this.address = address;
        this.bio = bio;
        this.updatedAt = LocalDateTime.now();
    }

    /** 프로필 정보를 업데이트합니다 (regionCode 포함). */
    public void updateProfileWithRegion(String name, String phone, String address, String bio, String regionCode) {
        updateProfile(name, phone, address, bio);
        this.regionCode = regionCode;
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

    /**
     * 자진 탈퇴 — 즉시 WITHDRAWN 상태로 전환.
     * 탈퇴일(withdrawalRequestedAt)로부터 30일 이내에 재로그인하면 복구 가능.
     * 호출 전 ACTIVE 여부는 유스케이스에서 검증합니다.
     */
    public void requestWithdrawal() {
        this.status = UserStatus.WITHDRAWN;
        this.withdrawalRequestedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 탈퇴된 계정을 다시 활성화합니다. (WITHDRAWN → ACTIVE)
     * 30일 이내에만 복구 가능하며, 초과 시 IllegalStateException.
     */
    public void reactivate(int graceDays) {
        if (this.withdrawalRequestedAt != null
                && this.withdrawalRequestedAt.plusDays(graceDays).isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("복구 가능 기간(" + graceDays + "일)이 만료되었습니다.");
        }
        this.status = UserStatus.ACTIVE;
        this.withdrawalRequestedAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 개인정보 비식별화 (영구 파기에 준하는 마스킹).
     * 이메일은 unique 유지를 위해 UUID 기반 더미 주소로 교체합니다.
     */
    public void anonymize() {
        this.name = "탈퇴한 사용자";
        this.email = "withdrawn-" + UUID.randomUUID() + "@invalid.local";
        this.phone = "000-0000-0000";
        this.password = null;
        this.address = null;
        this.bio = null;
        this.profileImageUrl = null;
        this.anonymizedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
