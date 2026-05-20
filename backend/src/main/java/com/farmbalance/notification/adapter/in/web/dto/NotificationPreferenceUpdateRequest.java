package com.farmbalance.notification.adapter.in.web.dto;

import com.farmbalance.notification.application.port.in.NotificationPreferenceUseCase.UpdatePreferenceCommand;

/**
 * 알림 설정 부분 업데이트 요청. null 필드는 변경 없음으로 처리됩니다.
 */
public record NotificationPreferenceUpdateRequest(
        Boolean balanceWarnEnabled,
        Boolean policyEnabled,
        Boolean orderEnabled,
        Boolean systemEnabled,
        Boolean guideWeatherEnabled,
        Boolean guideScheduleEnabled,
        Boolean guidePestEnabled,
        Boolean guideSoilEnabled
) {
    public UpdatePreferenceCommand toCommand() {
        return new UpdatePreferenceCommand(
                balanceWarnEnabled,
                policyEnabled,
                orderEnabled,
                systemEnabled,
                guideWeatherEnabled,
                guideScheduleEnabled,
                guidePestEnabled,
                guideSoilEnabled
        );
    }
}
