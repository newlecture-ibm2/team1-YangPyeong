package com.farmbalance.recommend.adapter.in.event;

import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.HealthCheckTriggerEvent;
import com.farmbalance.global.event.SyncTriggerEvent;
import com.farmbalance.recommend.adapter.out.external.KamisPriceAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KamisApiSyncEventListener {

    private final KamisPriceAdapter kamisPriceAdapter;
    private final ApplicationEventPublisher eventPublisher;

    @Async
    @EventListener
    public void onSyncTriggerEvent(SyncTriggerEvent event) {
        if (!"KAMIS_PRICE".equals(event.apiName())) {
            return;
        }

        log.info("[KamisApiSync] 수동 동기화 지시 수신. 모드={}", event.syncMode());
        try {
            // 대표 작물(감자) 조회로 테스트 및 갱신
            Integer price = kamisPriceAdapter.getRecentPricePerKg("감자");
            
            if (price != null) {
                eventPublisher.publishEvent(new ApiSyncEvent("KAMIS_PRICE", "SUCCESS", 1, null));
            } else {
                eventPublisher.publishEvent(new ApiSyncEvent("KAMIS_PRICE", "COMPLETED_WITH_WARNINGS", 0, "가격을 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            log.error("[KamisApiSync] 동기화 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("KAMIS_PRICE", "FAILED", 0, e.getMessage()));
        }
    }

    @Async
    @EventListener
    public void onHealthCheckTriggerEvent(HealthCheckTriggerEvent event) {
        if (!"KAMIS_PRICE".equals(event.apiName())) {
            return;
        }

        log.info("[KamisApiSync] 헬스체크 지시 수신.");
        try {
            Integer price = kamisPriceAdapter.getRecentPricePerKg("감자");
            if (price != null) {
                eventPublisher.publishEvent(new ApiSyncEvent("KAMIS_PRICE", "SUCCESS", 0, null, true));
            } else {
                eventPublisher.publishEvent(new ApiSyncEvent("KAMIS_PRICE", "FAILED", 0, "응답 오류", true));
            }
        } catch (Exception e) {
            log.error("[KamisApiSync] 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("KAMIS_PRICE", "FAILED", 0, e.getMessage(), true));
        }
    }
}
