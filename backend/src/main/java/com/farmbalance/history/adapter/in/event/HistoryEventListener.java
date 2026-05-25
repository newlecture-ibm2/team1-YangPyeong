package com.farmbalance.history.adapter.in.event;

import com.farmbalance.farm.domain.event.CultivationDeletedEvent;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import com.farmbalance.farm.domain.event.FarmRegisteredEvent;
import com.farmbalance.farm.domain.event.HarvestRecordedEvent;
import com.farmbalance.history.adapter.out.persistence.repository.HistoryJpaRepository;
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
    private final HistoryJpaRepository historyJpaRepository;
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

            // 면적 정보 포맷 (㎡와 평 병기)
            String areaInfo = "";
            if (event.getCultivationArea() != null) {
                double sqm = event.getCultivationArea().doubleValue();
                double pyeong = sqm / 3.3058;
                areaInfo = String.format(" (%.0f㎡ / %.0f평)", sqm, pyeong);
            }

            String content = String.format("🌱 재배등록: %s%s", cropName, areaInfo);

            RecordHistoryCommand command = RecordHistoryCommand.builder()
                    .farmId(event.getFarmId())
                    .cultivationRegistrationId(event.getId())
                    .recordDate(event.getSowingDate() != null ? event.getSowingDate() : java.time.LocalDate.now())
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
     * 재배 계획 수정 완료 시 자동으로 히스토리에 기록
     */
    @Async("historyTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleCultivationUpdatedEvent(com.farmbalance.farm.domain.event.CultivationUpdatedEvent event) {
        try {
            // crop 이름 조회
            String cropName = "알 수 없는 작물";
            try {
                cropName = jdbcTemplate.queryForObject(
                        "SELECT name FROM crops WHERE id = ?", String.class, event.getCropId());
            } catch (Exception e) {
                log.warn("작물명 조회 실패 - cropId: {}", event.getCropId());
            }

            // 수정 정보 포맷
            String areaInfo = "";
            if (event.getArea() != null) {
                double sqm = event.getArea();
                double pyeong = sqm / 3.3058;
                areaInfo = String.format(" (%.0f㎡ / %.0f평)", sqm, pyeong);
            }

            String content = String.format("✏️ 계획수정: %s%s", cropName, areaInfo);

            RecordHistoryCommand command = RecordHistoryCommand.builder()
                    .farmId(event.getFarmId())
                    .cultivationRegistrationId(event.getId())
                    .recordDate(java.time.LocalDate.now())
                    .activityType(HistoryType.SYSTEM)
                    .activityContent(content)
                    .build();

            recordHistoryUseCase.recordHistory(command);
            log.info("재배수정 이력 저장 성공 - 농장 ID: {}, 작물: {}", event.getFarmId(), cropName);

        } catch (Exception e) {
            log.error("재배수정 이력 저장 실패 - 농장 ID: {}, 원인: {}", event.getFarmId(), e.getMessage(), e);
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
                    .cultivationRegistrationId(event.getCultivationRegistrationId()) // 정확한 ID 매핑
                    .recordDate(event.getHarvestDate() != null ? event.getHarvestDate() : java.time.LocalDate.now())
                    .activityType(HistoryType.USER)
                    .activityContent(content)
                    .build();

            recordHistoryUseCase.recordHistory(command);
            log.info("수확완료 이력 저장 성공 - 농장 ID: {}, 작물: {}", event.getFarmId(), cropName);

        } catch (Exception e) {
            log.error("수확완료 이력 저장 실패 - 농장 ID: {}, 원인: {}", event.getFarmId(), e.getMessage(), e);
        }
    }

    /**
     * 재배 등록 삭제 시 관련 히스토리도 삭제
     */
    @Async("historyTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleCultivationDeletedEvent(CultivationDeletedEvent event) {
        try {
            historyJpaRepository.deleteByCultivationRegistrationId(event.getCultivationRegistrationId());
            log.info("재배등록 삭제에 따른 이력 삭제 성공 - 등록 ID: {}", event.getCultivationRegistrationId());
        } catch (Exception e) {
            log.error("재배등록 이력 삭제 실패 - 등록 ID: {}, 원인: {}", event.getCultivationRegistrationId(), e.getMessage());
        }
    }
}

