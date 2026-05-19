package com.farmbalance.recommend.adapter.in.event;

import com.farmbalance.recommend.adapter.out.external.KamisPriceBatchScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 앱 기동 후 KAMIS 시세 캐시를 1회 워밍합니다 (새벽 배치 전에도 DB 캐시 확보).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KamisPriceStartupRunner {

    private final KamisPriceBatchScheduler kamisPriceBatchScheduler;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void warmKamisCacheOnStartup() {
        try {
            Thread.sleep(30_000L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        log.info("KAMIS 시세 캐시 기동 워밍 시작");
        kamisPriceBatchScheduler.refreshAllCropPrices();
    }
}
