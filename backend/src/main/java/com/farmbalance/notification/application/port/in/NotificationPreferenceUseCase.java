package com.farmbalance.notification.application.port.in;

import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationPreference;

import java.util.List;

public interface NotificationPreferenceUseCase {
    /** 사용자 설정 조회 (없으면 기본값 반환 — 모두 활성화) */
    NotificationPreference getPreference(Long userId);

    /** 사용자 설정 부분 업데이트 */
    NotificationPreference updatePreference(Long userId, UpdatePreferenceCommand command);

    /** 특정 카테고리가 활성화되어 있는지 빠른 체크 (단건 알림 발송 전 호출) */
    boolean isEnabled(Long userId, NotificationCategory category);

    /**
     * 주어진 유저 목록에서 해당 카테고리 알림이 활성화된 유저만 반환.
     * 1번의 배치 조회로 N+1 방지 (bulk 알림 발송 전 호출)
     */
    List<Long> filterEnabledUserIds(List<Long> userIds, NotificationCategory category);

    /** 업데이트 커맨드 — null 필드는 변경 없음으로 처리 */
    record UpdatePreferenceCommand(
            Boolean balanceWarnEnabled,
            Boolean policyEnabled,
            Boolean orderEnabled,
            Boolean systemEnabled,
            Boolean guideWeatherEnabled,
            Boolean guideScheduleEnabled,
            Boolean guidePestEnabled,
            Boolean guideSoilEnabled
    ) {}
}
