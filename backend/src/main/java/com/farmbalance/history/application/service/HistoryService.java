package com.farmbalance.history.application.service;

import com.farmbalance.history.application.port.in.*;
import com.farmbalance.history.application.port.out.DeleteHistoryPort;
import com.farmbalance.history.application.port.out.LoadHistoryPort;
import com.farmbalance.history.application.port.out.SaveHistoryPort;
import com.farmbalance.history.domain.CultivationHistory;
import com.farmbalance.history.domain.HistoryType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HistoryService implements RecordHistoryUseCase, LoadHistoryUseCase, UpdateHistoryUseCase, DeleteHistoryUseCase {

    private final SaveHistoryPort saveHistoryPort;
    private final LoadHistoryPort loadHistoryPort;
    private final DeleteHistoryPort deleteHistoryPort;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    public void recordHistory(RecordHistoryCommand command) {
        CultivationHistory history = CultivationHistory.builder()
                .farmId(command.getFarmId())
                .cultivationRegistrationId(command.getCultivationRegistrationId())
                .recordDate(command.getRecordDate() != null ? command.getRecordDate() : java.time.LocalDate.now())
                .activityType(command.getActivityType())
                .activityContent(command.getActivityContent())
                .avgTemp(command.getAvgTemp())
                .totalRain(command.getTotalRain())
                .createdAt(LocalDateTime.now())
                .build();

        saveHistoryPort.saveHistory(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CultivationHistory> getHistoriesByFarmId(Long farmId) {
        return loadHistoryPort.loadHistoriesByFarmId(farmId);
    }

    @Override
    public void updateHistory(Long historyId, String activityContent, HistoryType activityType) {
        CultivationHistory history = loadHistoryPort.loadHistoryById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 히스토리입니다."));

        CultivationHistory updatedHistory = CultivationHistory.builder()
                .id(history.getId())
                .farmId(history.getFarmId())
                .cultivationRegistrationId(history.getCultivationRegistrationId())
                .recordDate(history.getRecordDate())
                .activityType(activityType != null ? activityType : history.getActivityType())
                .activityContent(activityContent)
                .avgTemp(history.getAvgTemp())
                .totalRain(history.getTotalRain())
                .createdAt(history.getCreatedAt())
                .build();

        saveHistoryPort.saveHistory(updatedHistory);
    }

    @Override
    public void deleteHistory(Long historyId) {
        // 삭제 전 데이터 조회
        loadHistoryPort.loadHistoryById(historyId).ifPresent(history -> {
            // "🌾 수확완료"로 시작하는 이력인 경우 수확 취소 이벤트 발행
            if (history.getActivityContent() != null && history.getActivityContent().startsWith("🌾 수확완료")) {
                String cropName = history.getActivityContent()
                        .replace("🌾 수확완료: ", "")
                        .split("\\(")[0].trim(); // "배추 (10.00 kg)" -> "배추"
                
                eventPublisher.publishEvent(new com.farmbalance.farm.domain.event.HarvestCanceledEvent(
                        history.getCultivationRegistrationId(),
                        cropName
                ));
            }
        });

        deleteHistoryPort.deleteHistory(historyId);
    }
}
