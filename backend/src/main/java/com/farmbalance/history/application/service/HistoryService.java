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

    @Override
    public void recordHistory(RecordHistoryCommand command) {
        CultivationHistory history = CultivationHistory.builder()
                .farmId(command.getFarmId())
                .historyType(command.getHistoryType())
                .content(command.getContent())
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
    public void updateHistory(Long historyId, String content, HistoryType historyType) {
        CultivationHistory history = loadHistoryPort.loadHistoryById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 히스토리입니다."));

        CultivationHistory updatedHistory = CultivationHistory.builder()
                .id(history.getId())
                .farmId(history.getFarmId())
                .historyType(historyType != null ? historyType : history.getHistoryType())
                .content(content)
                .createdAt(history.getCreatedAt())
                .build();

        saveHistoryPort.saveHistory(updatedHistory);
    }

    @Override
    public void deleteHistory(Long historyId) {
        deleteHistoryPort.deleteHistory(historyId);
    }
}
