package com.farmbalance.notification.application.service;

import com.farmbalance.notification.application.port.in.NotificationPreferenceUseCase;
import com.farmbalance.notification.application.port.out.NotificationPreferencePort;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationPreference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
                .orElse(true);
    }

    @Override
    public List<Long> filterEnabledUserIds(List<Long> userIds, NotificationCategory category) {
        if (userIds.isEmpty()) return List.of();

        // 1번의 SELECT IN으로 설정이 있는 유저만 조회
        Map<Long, NotificationPreference> prefMap = preferencePort.findAllByUserIdIn(userIds)
                .stream()
                .collect(Collectors.toMap(NotificationPreference::getUserId, p -> p));

        // 설정이 없는 유저는 기본값(활성화)으로 간주
        return userIds.stream()
                .filter(userId -> {
                    NotificationPreference pref = prefMap.get(userId);
                    return pref == null || pref.isEnabled(category);
                })
                .toList();
    }
}
