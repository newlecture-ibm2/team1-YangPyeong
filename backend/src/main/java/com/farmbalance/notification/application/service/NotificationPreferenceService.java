package com.farmbalance.notification.application.service;

import com.farmbalance.notification.application.port.in.NotificationPreferenceUseCase;
import com.farmbalance.notification.application.port.out.NotificationPreferencePort;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationPreference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationPreferenceService implements NotificationPreferenceUseCase {

    private final NotificationPreferencePort preferencePort;

    @Override
    public NotificationPreference getPreference(Long userId) {
        return preferencePort.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.defaultFor(userId));
    }

    @Override
    @Transactional
    public NotificationPreference updatePreference(Long userId, UpdatePreferenceCommand cmd) {
        NotificationPreference current = preferencePort.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.defaultFor(userId));

        if (cmd.balanceWarnEnabled() != null) current.setBalanceWarnEnabled(cmd.balanceWarnEnabled());
        if (cmd.policyEnabled() != null) current.setPolicyEnabled(cmd.policyEnabled());
        if (cmd.orderEnabled() != null) current.setOrderEnabled(cmd.orderEnabled());
        if (cmd.systemEnabled() != null) current.setSystemEnabled(cmd.systemEnabled());
        if (cmd.guideWeatherEnabled() != null) current.setGuideWeatherEnabled(cmd.guideWeatherEnabled());
        if (cmd.guideScheduleEnabled() != null) current.setGuideScheduleEnabled(cmd.guideScheduleEnabled());
        if (cmd.guidePestEnabled() != null) current.setGuidePestEnabled(cmd.guidePestEnabled());
        if (cmd.guideSoilEnabled() != null) current.setGuideSoilEnabled(cmd.guideSoilEnabled());

        NotificationPreference saved = preferencePort.save(current);
        log.info("[NotificationPreference] 설정 업데이트 - userId={}", userId);
        return saved;
    }

    @Override
    public boolean isEnabled(Long userId, NotificationCategory category) {
        return preferencePort.findByUserId(userId)
                .map(p -> p.isEnabled(category))
                .orElse(true); // 설정이 없으면 기본 활성화로 간주
    }
}
