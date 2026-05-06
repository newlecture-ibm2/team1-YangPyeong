package com.farmbalance.history.adapter.in.event;

import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import com.farmbalance.farm.domain.event.FarmRegisteredEvent;
import com.farmbalance.farm.domain.event.HarvestRecordedEvent;
import com.farmbalance.history.application.port.in.RecordHistoryCommand;
import com.farmbalance.history.application.port.in.RecordHistoryUseCase;
import com.farmbalance.history.domain.HistoryType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

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

    /**
     * 재배 등록 완료 시 자동으로 히스토리에 기록
     */
    @Async("historyTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleCultivationRegisteredEvent(CultivationRegisteredEvent event) {
        try {
            // crop 이름 조회
            String cropName = "알 수 없는 작물";
            try {
                cropName = jdbcTemplate.queryForObject(
                        "SELECT name FROM crops WHERE id = ?", String.class, event.getCropId());
            } catch (Exception e) {
                log.warn("작물명 조회 실패 - cropId: {}", event.getCropId());
            }

            // 면적 정보 포맷
            String areaInfo = event.getCultivationArea() != null
                    ? String.format(" (%.0f㎡)", event.getCultivationArea())
                    : "";

            String content = String.format("🌱 재배등록: %s%s", cropName, areaInfo);

            RecordHistoryCommand command = RecordHistoryCommand.builder()
                    .farmId(event.getFarmId())
                    .recordDate(java.time.LocalDate.now())
                    .activityType(HistoryType.SYSTEM)
                    .activityContent(content)
                    .build();

            recordHistoryUseCase.recordHistory(command);
            log.info("재배등록 이력 저장 성공 - 농장 ID: {}, 작물: {}", event.getFarmId(), cropName);

        } catch (Exception e) {
            log.error("재배등록 이력 저장 실패 - 농장 ID: {}, 원인: {}", event.getFarmId(), e.getMessage(), e);
        }
    }

    /**
     * 수확 등록 완료 시 자동으로 히스토리에 기록
     */
    @Async("historyTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleHarvestRecordedEvent(HarvestRecordedEvent event) {
        try {
            // crop 이름 조회
            String cropName = "알 수 없는 작물";
            try {
                cropName = jdbcTemplate.queryForObject(
                        "SELECT name FROM crops WHERE id = ?", String.class, event.getCropId());
            } catch (Exception e) {
                log.warn("작물명 조회 실패 - cropId: {}", event.getCropId());
            }

            // 수확량 정보 포맷
            String yieldInfo = event.getYieldAmount() != null
                    ? String.format(" (%.2f %s)", event.getYieldAmount(), event.getYieldUnit())
                    : "";

            String content = String.format("🌾 수확완료: %s%s", cropName, yieldInfo);

            RecordHistoryCommand command = RecordHistoryCommand.builder()
                    .farmId(event.getFarmId())
                    .recordDate(java.time.LocalDate.now())
                    .activityType(HistoryType.USER)
                    .activityContent(content)
                    .build();

            recordHistoryUseCase.recordHistory(command);
            log.info("수확완료 이력 저장 성공 - 농장 ID: {}, 작물: {}", event.getFarmId(), cropName);

        } catch (Exception e) {
            log.error("수확완료 이력 저장 실패 - 농장 ID: {}, 원인: {}", event.getFarmId(), e.getMessage(), e);
        }
    }
}

