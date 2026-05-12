package com.farmbalance.user.adapter.in.scheduler;

import com.farmbalance.user.application.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 탈퇴 유예 만료 → 최종 WITHDRAWN + 이벤트 발행, 이후 비식별화 배치.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserAccountMaintenanceScheduler {

    private final UserService userService;

    /** 매일 자정 (KST 기준 서버 로컬 시각 — 운영 시 TZ 고려) */
    @Scheduled(cron = "0 0 0 * * *")
    public void finalizePendingWithdrawals() {
        try {
            userService.finalizeDueWithdrawals();
        } catch (Exception e) {
            log.error("탈퇴 유예 만료 배치 실패", e);
        }
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void anonymizeWithdrawnUsers() {
        try {
            userService.anonymizeDueWithdrawnUsers();
        } catch (Exception e) {
            log.error("탈퇴 계정 비식별화 배치 실패", e);
        }
    }
}
