package com.farmbalance.user.adapter.out.persistence.entity;

import com.farmbalance.user.domain.AuthProvider;
import com.farmbalance.user.domain.UserSocialAccount;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 소셜 계정 연동 JPA 엔티티
 * users : user_social_accounts = 1 : N
 */
@Entity
@Table(name = "user_social_accounts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_id"}))
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserSocialAccountJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @Column(name = "provider_id", nullable = false, length = 100)
    private String providerId;

    @CreatedDate
    @Column(name = "linked_at", updatable = false)
    private LocalDateTime linkedAt;

    /* ── 도메인 변환 ── */

    public UserSocialAccount toDomain() {
        return UserSocialAccount.builder()
                .id(id)
                .userId(userId)
                .provider(provider)
                .providerId(providerId)
                .linkedAt(linkedAt)
                .build();
    }

    public static UserSocialAccountJpaEntity fromDomain(UserSocialAccount domain) {
        return UserSocialAccountJpaEntity.builder()
                .id(domain.getId())
                .userId(domain.getUserId())
                .provider(domain.getProvider())
                .providerId(domain.getProviderId())
                .build();
    }
}
