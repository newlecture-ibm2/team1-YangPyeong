package com.farmbalance.notification.adapter.in.web.dto;

import com.farmbalance.notification.domain.NotificationPreference;
import lombok.Builder;

@Builder
public record NotificationPreferenceResponse(
        boolean balanceWarnEnabled,
        boolean policyEnabled,
        boolean orderEnabled,
        boolean systemEnabled,
        boolean guideWeatherEnabled,
        boolean guideScheduleEnabled,
        boolean guidePestEnabled,
        boolean guideSoilEnabled
) {
    public static NotificationPreferenceResponse fromDomain(NotificationPreference p) {
        return NotificationPreferenceResponse.builder()
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
}
