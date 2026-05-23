package com.farmbalance.balance.adapter.in.scheduler;

import com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase;
import com.farmbalance.balance.adapter.in.event.BalanceEventListener;
import com.farmbalance.balance.domain.SupplyRatioResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * balance_data 테이블 전체 동기화 스케줄러
 *
 * SupplyService의 실시간 계산 결과를 balance_data에 일괄 UPSERT하여
 * 지자체 포탈(/gov/balance)에서도 농민 쪽(/balance)과 동일한 수급 데이터를 조회할 수 있도록 합니다.
 *
 * [트리거 시점]
 * 1. 앱 기동 완료 후 (ApplicationReadyEvent) — 시작 시 즉시 전체 동기화
 * 2. 매일 새벽 04시 — 일괄 정기 동기화
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BalanceDataSyncScheduler {

    private final CalculateSupplyRatioUseCase calculateSupplyRatioUseCase;
    private final BalanceEventListener balanceEventListener;

    /**
     * 앱 기동 완료 후 전체 balance_data 동기화
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("[Balance-Sync-Scheduler] 앱 기동 완료 — balance_data 전체 동기화 시작");
        syncAll();
    }

    /**
     * 매일 새벽 04시 전체 동기화 (크론 스케줄)
     */
    @Scheduled(cron = "0 0 4 * * *")
    public void scheduledSync() {
        log.info("[Balance-Sync-Scheduler] 정기 일괄 동기화 시작 (04:00 크론)");
        syncAll();
    }

    /**
     * 모든 작물의 수급 비율을 재계산하여 balance_data 테이블에 일괄 UPSERT
     */
    private void syncAll() {
        long startTime = System.currentTimeMillis();

        try {
            // 전체 작물 수급 비율 일괄 계산
            Map<String, SupplyRatioResult> allResults = calculateSupplyRatioUseCase.calculateAllSupplyRatios(null);

            int syncCount = 0;
            for (Map.Entry<String, SupplyRatioResult> entry : allResults.entrySet()) {
                String cropName = entry.getKey();
                SupplyRatioResult result = entry.getValue();

                // BalanceEventListener의 syncToBalanceData 메서드를 재사용
                balanceEventListener.syncToBalanceData(cropName, result);
                syncCount++;
            }

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("[Balance-Sync-Scheduler] 전체 동기화 완료 — 작물 {}개, 소요시간 {}ms", syncCount, elapsed);
        } catch (Exception e) {
            log.error("[Balance-Sync-Scheduler] 전체 동기화 실패: {}", e.getMessage(), e);
        }
    }
}
