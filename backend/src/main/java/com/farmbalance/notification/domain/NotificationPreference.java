package com.farmbalance.notification.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 사용자 알림 수신 설정 도메인.
 * 각 카테고리별 on/off 플래그를 보유하며, 미존재 사용자에 대해서는 기본값(모두 true)을 가정합니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {
    private Long id;
    private Long userId;

    private boolean balanceWarnEnabled;
    private boolean policyEnabled;
    private boolean orderEnabled;
    private boolean systemEnabled;

    private boolean guideWeatherEnabled;
    private boolean guideScheduleEnabled;
    private boolean guidePestEnabled;
    private boolean guideSoilEnabled;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 모든 카테고리 활성화된 기본값 */
    public static NotificationPreference defaultFor(Long userId) {
        return NotificationPreference.builder()
                .userId(userId)
                .balanceWarnEnabled(true)
                .policyEnabled(true)
                .orderEnabled(true)
                .systemEnabled(true)
                .guideWeatherEnabled(true)
                .guideScheduleEnabled(true)
                .guidePestEnabled(true)
                .guideSoilEnabled(true)
                .build();
    }

    /** 특정 카테고리의 활성화 여부 조회 */
    public boolean isEnabled(NotificationCategory category) {
        return switch (category) {
            case BALANCE_WARN -> balanceWarnEnabled;
            case POLICY -> policyEnabled;
            case ORDER -> orderEnabled;
            case SYSTEM -> systemEnabled;
            case GUIDE_WEATHER -> guideWeatherEnabled;
            case GUIDE_SCHEDULE -> guideScheduleEnabled;
            case GUIDE_PEST -> guidePestEnabled;
            case GUIDE_SOIL -> guideSoilEnabled;
        };
    }
}
