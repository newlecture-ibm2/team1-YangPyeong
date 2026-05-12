package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.out.PredictYieldPort;
import com.farmbalance.farm.application.port.out.UpdateCultivationStatePort;
import com.farmbalance.farm.domain.CultivationStatus;
import com.farmbalance.farm.domain.event.CultivationChangedEvent;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import com.farmbalance.farm.domain.event.HarvestCanceledEvent;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 재배 등록 관련 이벤트 리스너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CultivationEventListener {

    private final PredictYieldPort predictYieldPort;
    private final UpdateCultivationStatePort updateCultivationStatePort;
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationUseCase notificationUseCase;

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
            
            // 2. 정책 매칭 알림 발송 (기획서 반영)
            if (event.getUserId() != null && event.getCropName() != null) {
                String message = String.format("등록하신 [%s] 재배에 대한 양평군의 최신 지원 정책을 확인해 보세요!", event.getCropName());
                notificationUseCase.createNotification(
                        event.getUserId(),
                        NotificationType.POLICY,
                        "정책 추천 알림",
                        message,
                        "/policy"
                );
                log.info("Policy Matching Notification sent to user {} for crop {}", event.getUserId(), event.getCropName());
            }
            
        } catch (Exception e) {
            log.error("Failed to predict yield for cultivation ID: {}", event.getId(), e);
        }
    }

    /**
     * 수확 이력 삭제 시 재배 상태를 ACTIVE로 복구 (FB-171 관련 보완)
     */
    @Async
    @EventListener
    public void handleHarvestCanceled(HarvestCanceledEvent event) {
        log.info("[Event-Farm] 수확 취소 감지 - 상태 복구 시작: registrationId={}, cropName={}", 
                event.getCultivationRegistrationId(), event.getCropName());
        
        try {
            // 1. 상태를 ACTIVE로 복구
            updateCultivationStatePort.updateStatus(event.getCultivationRegistrationId(), CultivationStatus.ACTIVE);
            log.info("[Event-Farm] 작물 상태 복구 완료: ACTIVE");

            // 2. 대시보드 캐시 무효화를 위해 변경 이벤트 재발행
            eventPublisher.publishEvent(new CultivationChangedEvent(
                    event.getCultivationRegistrationId(),
                    null, // userId (여기서는 생략)
                    event.getCropName(),
                    null, // oldCropName은 필요 없음
                    "UPDATED",
                    java.time.LocalDateTime.now()
            ));
            log.info("[Event-Farm] 수급 밸런스 갱신 이벤트 재발행 완료");

        } catch (Exception e) {
            log.error("[Event-Farm-Error] 수확 취소 처리 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}
