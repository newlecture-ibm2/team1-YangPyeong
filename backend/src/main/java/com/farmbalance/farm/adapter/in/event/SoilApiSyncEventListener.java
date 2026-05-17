package com.farmbalance.farm.adapter.in.event;

import com.farmbalance.farm.adapter.out.external.soil.SoilApiClient;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.HealthCheckTriggerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SoilApiSyncEventListener {

    private final SoilApiClient soilApiClient;
    private final ApplicationEventPublisher eventPublisher;

    @Async
    @EventListener
    public void onHealthCheckTriggerEvent(HealthCheckTriggerEvent event) {
        if (!"SOIL_ENVIRONMENT".equals(event.apiName())) {
            return;
        }

        log.info("[SoilApiSync] 헬스체크 지시 수신.");
        try {
            // 양평군 양평읍 백안리(4183025021) 등 특정 PNU 코드로 V3 호출 헬스체크
            var response = soilApiClient.getSoilCharacteristics("4183025021");
            
            if (response != null && response.getHeader() != null && "00".equals(response.getHeader().getResultCode())) {
                eventPublisher.publishEvent(new ApiSyncEvent("SOIL_ENVIRONMENT", "SUCCESS", 0, null, true));
            } else {
                eventPublisher.publishEvent(new ApiSyncEvent("SOIL_ENVIRONMENT", "FAILED", 0, "API 응답 오류", true));
            }
        } catch (Exception e) {
            log.error("[SoilApiSync] 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("SOIL_ENVIRONMENT", "FAILED", 0, e.getMessage(), true));
        }
    }
}
