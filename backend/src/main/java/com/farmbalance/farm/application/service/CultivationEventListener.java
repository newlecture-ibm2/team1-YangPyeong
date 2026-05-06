package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.out.PredictYieldPort;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 재배 등록 관련 이벤트 리스너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CultivationEventListener {

    private final PredictYieldPort predictYieldPort;

    /**
     * 재배 등록 시 비동기로 AI 수확량 예측 수행
     * (현재 ai_predicted_yield 컬럼이 삭제되었으므로 DB 저장은 하지 않고 분석 로그만 남깁니다)
     */
    @Async
    @EventListener
    public void handleCultivationRegistered(CultivationRegisteredEvent event) {
        log.info("Handling CultivationRegisteredEvent for ID: {}", event.getId());
        
        try {
            // 1. AI 서버 호출하여 예상 수확량 예측 (분석용)
            Double predictedYield = predictYieldPort.predictYield(
                    event.getCropId(),
                    event.getCultivationArea().doubleValue(),
                    "OUTDOOR" // 기본값 전달 (컬럼 삭제로 인해 정보 부재)
            );

            log.info("AI Analysis - Predicted yield for cultivation ID {}: {} kg", event.getId(), predictedYield);
            
            // TODO: 추후 분석 전용 테이블이나 수급 알림 엔진으로 데이터 연동이 필요한 경우 이곳에 추가 로직 구현
            
        } catch (Exception e) {
            log.error("Failed to predict yield for cultivation ID: {}", event.getId(), e);
        }
    }
}
