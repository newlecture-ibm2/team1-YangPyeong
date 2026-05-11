package com.farmbalance.farm.adapter.in.event;

import com.farmbalance.farm.application.service.DailyWeatherRecordScheduler;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.SyncTriggerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherApiSyncEventListener {

    private final DailyWeatherRecordScheduler dailyWeatherRecordScheduler;
    private final ApplicationEventPublisher eventPublisher;

    @Async
    @EventListener
    public void onSyncTriggerEvent(SyncTriggerEvent event) {
        if (!"WEATHER_RECORD".equals(event.apiName())) {
            return;
        }

        log.info("[WeatherApiSync] 수동 동기화 지시 수신. 모드={}", event.syncMode());
        try {
            // 기존 스케줄러 메서드 재사용
            dailyWeatherRecordScheduler.recordDailyWeather();
            
            eventPublisher.publishEvent(new ApiSyncEvent(
                    "WEATHER_RECORD", "SUCCESS", 0, null));
        } catch (Exception e) {
            log.error("[WeatherApiSync] 동기화 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent(
                    "WEATHER_RECORD", "FAILED", 0, e.getMessage()));
        }
    }
}
