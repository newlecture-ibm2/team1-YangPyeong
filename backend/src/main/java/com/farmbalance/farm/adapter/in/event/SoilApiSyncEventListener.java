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
            // 양평군 양평읍 백안리(4183025021) 등 특정 PNU 코드로 V3, V2 호출 헬스체크 (반드시 19자리여야 함)
            String pnuCode = "4183025021100010000";
            var v3Response = soilApiClient.getSoilCharacteristics(pnuCode);
            var v2Response = soilApiClient.getSoilChemicalCharacteristics(pnuCode);
            
            boolean isV3Success = v3Response != null && v3Response.getHeader() != null && "00".equals(v3Response.getHeader().getResultCode());
            boolean isV2Success = v2Response != null && v2Response.getHeader() != null && "00".equals(v2Response.getHeader().getResultCode());

            if (isV3Success && isV2Success) {
                eventPublisher.publishEvent(new ApiSyncEvent("SOIL_ENVIRONMENT", "SUCCESS", 0, null, true));
            } else {
                String errorMsg = String.format("API 응답 오류 (V3: %s, V2: %s)", 
                    isV3Success ? "OK" : "FAIL", isV2Success ? "OK" : "FAIL");
                eventPublisher.publishEvent(new ApiSyncEvent("SOIL_ENVIRONMENT", "FAILED", 0, errorMsg, true));
            }
        } catch (Exception e) {
            log.error("[SoilApiSync] 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("SOIL_ENVIRONMENT", "FAILED", 0, e.getMessage(), true));
        }
    }
}
