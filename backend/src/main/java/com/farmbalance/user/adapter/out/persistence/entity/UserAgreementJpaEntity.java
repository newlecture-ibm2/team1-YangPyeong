package com.farmbalance.user.adapter.out.persistence.entity;

import com.farmbalance.user.domain.UserAgreement;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_agreements")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserAgreementJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserAgreement.AgreementType agreementType;

    @Column(nullable = false, length = 20)
    private String version;

    @Column(nullable = false)
    private boolean isAgreed;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime agreedAt;

    public static UserAgreementJpaEntity fromDomain(UserAgreement domain) {
        return UserAgreementJpaEntity.builder()
                .userId(domain.getUserId())
                .agreementType(domain.getAgreementType())
                .version(domain.getVersion())
                .isAgreed(domain.isAgreed())
                .build();
    }

    public UserAgreement toDomain() {
        return UserAgreement.builder()
                .id(id)
                .userId(userId)
                .agreementType(agreementType)
                .version(version)
                .isAgreed(isAgreed)
                .agreedAt(agreedAt)
                .build();
    }
}
