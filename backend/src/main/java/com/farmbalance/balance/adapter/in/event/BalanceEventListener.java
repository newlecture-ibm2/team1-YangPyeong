package com.farmbalance.balance.adapter.in.event;

import com.farmbalance.farm.domain.event.CultivationChangedEvent;
import com.farmbalance.farm.domain.event.HarvestRecordedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class BalanceEventListener {

    private final com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase calculateSupplyRatioUseCase;
    private final org.springframework.cache.CacheManager cacheManager;

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCultivationChanged(CultivationChangedEvent event) {
        log.info("[Event-Balance] 수급 밸런스 업데이트 및 캐시 무효화 시작 - 작물: {}, 유형: {}", event.cropName(), event.changeType());

        try {
            // 1. 현재 작물에 대한 수급 비율 재계산 및 캐시 무효화
            calculateSupplyRatioUseCase.recalculate(event.cropName());
            evictSupplyTrendCache(event.cropName());

            // 2. 만약 작물명이 바뀌었다면 이전 작물도 재계산 및 캐시 무효화
            if (event.oldCropName() != null && !event.oldCropName().equals(event.cropName())) {
                log.info("[Event-Balance] 작물명 변경 감지: {} -> {}. 기존 작물 캐시도 무효화합니다.", event.oldCropName(), event.cropName());
                calculateSupplyRatioUseCase.recalculate(event.oldCropName());
                evictSupplyTrendCache(event.oldCropName());
            }

            log.info("[Event-Balance] 수급 밸런스 업데이트 및 캐시 무효화 완료 - 작물: {}", event.cropName());
        } catch (Exception e) {
            log.error("[Event-Balance-Error] 수급 밸런스 업데이트 실패 - 작물: {}, 원인: {}", event.cropName(), e.getMessage(), e);
        }
    }

    @Async("eventTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleHarvestRecorded(HarvestRecordedEvent event) {
        log.info("[Event-Balance] 수확 완료 감지 - 캐시 무효화 시작: {}", event.getCropName());
        try {
            calculateSupplyRatioUseCase.recalculate(event.getCropName());
            evictSupplyTrendCache(event.getCropName());
            log.info("[Event-Balance] 수확 완료에 따른 수급 밸런스 갱신 완료: {}", event.getCropName());
        } catch (Exception e) {
            log.error("[Event-Balance-Error] 수확 완료 처리 실패: {}, 원인: {}", event.getCropName(), e.getMessage(), e);
        }
    }

    private void evictSupplyTrendCache(String cropName) {
        org.springframework.cache.Cache cache = cacheManager.getCache("supplyTrends");
        if (cache != null) {
            cache.evict(cropName);
            log.info("[Cache-Evict] 'supplyTrends' 캐시 삭제 완료 - 키: {}", cropName);
        }
    }
}
