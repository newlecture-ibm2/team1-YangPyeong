package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.ShortTermForecast;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.HealthCheckTriggerEvent;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CurrentWeatherSyncScheduler {

    private final WeatherRecordPort weatherRecordPort;
    private final ApplicationEventPublisher eventPublisher;

    private volatile ShortTermForecast currentForecast = null;
    private static final int DEFAULT_NX = 69;
    private static final int DEFAULT_NY = 125;

    @PostConstruct
    public void init() {
        // 서버 시작 시 최초 1회 즉시 실행 (스레드 블로킹을 막기 위해 비동기로 실행하거나 초기화 시에는 에러 무시)
        new Thread(this::syncCurrentWeather).start();
    }

    // 매 30분마다 기상청 단기예보 데이터 동기화
    @Scheduled(cron = "0 0/30 * * * *")
    public void syncCurrentWeather() {
        log.info("[Scheduler] 실시간 기상청 날씨 동기화 시작 (nx={}, ny={})", DEFAULT_NX, DEFAULT_NY);
        try {
            ShortTermForecast forecast = weatherRecordPort.fetchShortTermForecast(DEFAULT_NX, DEFAULT_NY);
            this.currentForecast = forecast;
            log.info("[Scheduler] 기상청 날씨 동기화 성공: {}", forecast);
            
            // 시스템 로그성 이벤트는 굳이 매 30분마다 찍히면 너무 많으므로, 필요 시 주석 해제하거나 로직 조정
            // eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_CURRENT", "SUCCESS", 0, null));
        } catch (Exception e) {
            log.error("[Scheduler] 기상청 실시간 날씨 동기화 실패", e);
            // 에러 발생 시 관리자 알림을 위해 이벤트 발행
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_CURRENT", "FAILED", 0, e.getMessage()));
        }
    }

    @Async
    @EventListener
    public void onHealthCheckTriggerEvent(HealthCheckTriggerEvent event) {
        if (!"WEATHER_CURRENT".equals(event.apiName())) {
            return;
        }
        log.info("[Scheduler] 기상청 실시간 날씨 헬스체크 지시 수신");
        try {
            ShortTermForecast forecast = weatherRecordPort.fetchShortTermForecast(DEFAULT_NX, DEFAULT_NY);
            this.currentForecast = forecast;
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_CURRENT", "SUCCESS", 0, null, true));
        } catch (Exception e) {
            log.error("[Scheduler] 기상청 실시간 날씨 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("WEATHER_CURRENT", "FAILED", 0, e.getMessage(), true));
        }
    }

    /**
     * @return 최신 캐시된 날씨 데이터. 만약 1번도 성공한 적이 없다면 시스템 오류 방지용 기본값 반환.
     */
    public ShortTermForecast getCurrentForecast() {
        if (currentForecast != null) {
            return currentForecast;
        }
        log.warn("[WeatherCache] 저장된 실시간 날씨가 없습니다. 기본값을 반환합니다.");
        return ShortTermForecast.builder()
                .tmp(20.0)
                .reh(50.0)
                .pcp("0")
                .pty(0)
                .sky(1)
                .wsd(1.0)
                .build();
    }
}
