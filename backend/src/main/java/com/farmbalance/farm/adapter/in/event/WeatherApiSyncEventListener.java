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
            // 기존 스케줄러 메서드 재사용 (내부에서 자체적으로 ApiSyncEvent를 발행합니다)
            dailyWeatherRecordScheduler.recordDailyWeather();
        } catch (Exception e) {
            log.error("[WeatherApiSync] 동기화 실패: {}", e.getMessage());
            // 에러 이벤트 처리도 recordDailyWeather() 내부에서 수행하므로 여기서 추가 발행 불필요
        }
    }
}
