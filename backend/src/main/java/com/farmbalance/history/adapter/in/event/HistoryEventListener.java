package com.farmbalance.history.adapter.in.event;

import com.farmbalance.farm.domain.event.FarmRegisteredEvent;
import com.farmbalance.history.application.port.in.RecordHistoryCommand;
import com.farmbalance.history.application.port.in.RecordHistoryUseCase;
import com.farmbalance.history.domain.HistoryType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class HistoryEventListener {

    private final RecordHistoryUseCase recordHistoryUseCase;

    @Async("historyTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFarmRegisteredEvent(FarmRegisteredEvent event) {
        try {
            String content = String.format("시스템: [%s] 농장이 등록되었습니다.", event.getFarmName());

            RecordHistoryCommand command = RecordHistoryCommand.builder()
                    .farmId(event.getFarmId())
                    .recordDate(java.time.LocalDate.now())
                    .activityType(HistoryType.SYSTEM)
                    .activityContent(content)
                    .build();

            recordHistoryUseCase.recordHistory(command);
            log.info("이력 저장 성공 - 농장 ID: {}", event.getFarmId());

        } catch (Exception e) {
            // 이력 저장 중 예외가 발생하더라도 메인 트랜잭션이나 유저 응답에 영향을 주지 않도록 완벽 격리
            log.error("이력 저장 실패 - 농장 ID: {}, 원인: {}", event.getFarmId(), e.getMessage(), e);
        }
    }
}
