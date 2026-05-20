package com.farmbalance.notification.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import com.farmbalance.notification.domain.NotificationPreference;
import jakarta.persistence.*;
import lombok.*;

/**
 * 알림 수신 설정 JPA 엔티티 — notification_preferences 테이블 매핑
 */
@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class NotificationPreferenceJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "balance_warn_enabled", nullable = false)
    private boolean balanceWarnEnabled;

    @Column(name = "policy_enabled", nullable = false)
    private boolean policyEnabled;

    @Column(name = "order_enabled", nullable = false)
    private boolean orderEnabled;

    @Column(name = "system_enabled", nullable = false)
    private boolean systemEnabled;

    @Column(name = "guide_weather_enabled", nullable = false)
    private boolean guideWeatherEnabled;

    @Column(name = "guide_schedule_enabled", nullable = false)
    private boolean guideScheduleEnabled;

    @Column(name = "guide_pest_enabled", nullable = false)
    private boolean guidePestEnabled;

    @Column(name = "guide_soil_enabled", nullable = false)
    private boolean guideSoilEnabled;

    public NotificationPreference toDomain() {
        return NotificationPreference.builder()
                .id(this.id)
                .userId(this.userId)
                .balanceWarnEnabled(this.balanceWarnEnabled)
                .policyEnabled(this.policyEnabled)
                .orderEnabled(this.orderEnabled)
                .systemEnabled(this.systemEnabled)
                .guideWeatherEnabled(this.guideWeatherEnabled)
                .guideScheduleEnabled(this.guideScheduleEnabled)
                .guidePestEnabled(this.guidePestEnabled)
                .guideSoilEnabled(this.guideSoilEnabled)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .build();
    }

    public static NotificationPreferenceJpaEntity fromDomain(NotificationPreference p) {
        return NotificationPreferenceJpaEntity.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .balanceWarnEnabled(p.isBalanceWarnEnabled())
                .policyEnabled(p.isPolicyEnabled())
                .orderEnabled(p.isOrderEnabled())
                .systemEnabled(p.isSystemEnabled())
                .guideWeatherEnabled(p.isGuideWeatherEnabled())
                .guideScheduleEnabled(p.isGuideScheduleEnabled())
                .guidePestEnabled(p.isGuidePestEnabled())
                .guideSoilEnabled(p.isGuideSoilEnabled())
                .build();
    }

    public void updateFromDomain(NotificationPreference p) {
        this.balanceWarnEnabled = p.isBalanceWarnEnabled();
        this.policyEnabled = p.isPolicyEnabled();
        this.orderEnabled = p.isOrderEnabled();
        this.systemEnabled = p.isSystemEnabled();
        this.guideWeatherEnabled = p.isGuideWeatherEnabled();
        this.guideScheduleEnabled = p.isGuideScheduleEnabled();
        this.guidePestEnabled = p.isGuidePestEnabled();
        this.guideSoilEnabled = p.isGuideSoilEnabled();
    }
}
