package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.out.LoadCultivationRegistrationPort;
import com.farmbalance.farm.application.port.out.PredictYieldPort;
import com.farmbalance.farm.application.port.out.SaveCultivationRegistrationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 재배 등록 관련 이벤트 리스너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CultivationEventListener {

    private final PredictYieldPort predictYieldPort;
    private final LoadCultivationRegistrationPort loadPort;
    private final SaveCultivationRegistrationPort savePort;

    /**
     * 재배 등록 시 비동기로 AI 수확량 예측 수행
     */
    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleCultivationRegistered(CultivationRegisteredEvent event) {
        log.info("Handling CultivationRegisteredEvent for ID: {}", event.getCultivationId());
        
        try {
            // 1. AI 서버 호출하여 예상 수확량 예측
            Double predictedYield = predictYieldPort.predictYield(
                    event.getCropId(),
                    event.getArea(),
                    event.getType().name()
            );

            // 2. 결과 업데이트 (새로운 트랜잭션에서 수행)
            loadPort.loadCultivation(event.getCultivationId()).ifPresent(cultivation -> {
                cultivation.updateAiPredictedYield(predictedYield);
                savePort.saveCultivation(cultivation);
                log.info("Successfully updated AI predicted yield ({}) for cultivation ID: {}", predictedYield, cultivation.getId());
            });
            
        } catch (Exception e) {
            log.error("Failed to predict yield for cultivation ID: {}", event.getCultivationId(), e);
        }
    }
}
