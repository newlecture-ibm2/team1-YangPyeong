package com.farmbalance.user.adapter.in.scheduler;

import com.farmbalance.global.batch.BatchLogService;
import com.farmbalance.user.application.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 탈퇴 계정 비식별화 배치 스케줄러.
 * 매일 자정에 30일(또는 5년) 경과한 탈퇴 유저의 개인정보를 비식별화하고,
 * 농장/장바구니 정리 이벤트를 발행합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserAccountMaintenanceScheduler {

    private final UserService userService;
    private final BatchLogService batchLogService;

    /** 매일 자정 (KST 기준 서버 로컬 시각 — 운영 시 TZ 고려) */
    @Scheduled(cron = "0 0 0 * * *")
    public void anonymizeWithdrawnUsers() {
        batchLogService.execute("USER_ANONYMIZE", () -> userService.anonymizeDueWithdrawnUsers());
    }
}
