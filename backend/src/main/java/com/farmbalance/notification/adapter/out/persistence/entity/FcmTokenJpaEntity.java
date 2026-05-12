package com.farmbalance.notification.adapter.out.persistence.entity;

import com.farmbalance.notification.domain.FcmToken;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "fcm_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class FcmTokenJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 500)
    private String token;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Domain -> Entity
    public static FcmTokenJpaEntity fromDomain(FcmToken domain) {
        return new FcmTokenJpaEntity(
                domain.getId(),
                domain.getUserId(),
                domain.getToken(),
                domain.getDeviceType(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
    }

    // Entity -> Domain
    public FcmToken toDomain() {
        return FcmToken.builder()
                .id(this.id)
                .userId(this.userId)
                .token(this.token)
                .deviceType(this.deviceType)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }
}
