package com.farmbalance.history.adapter.out.persistence;

import com.farmbalance.history.adapter.out.persistence.entity.HistoryJpaEntity;
import com.farmbalance.history.adapter.out.persistence.repository.HistoryJpaRepository;
import com.farmbalance.history.application.port.out.DeleteHistoryPort;
import com.farmbalance.history.application.port.out.LoadHistoryPort;
import com.farmbalance.history.application.port.out.SaveHistoryPort;
import com.farmbalance.history.domain.CultivationHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class HistoryPersistenceAdapter implements SaveHistoryPort, LoadHistoryPort, DeleteHistoryPort {

    private final HistoryJpaRepository repository;

    @Override
    public void saveHistory(CultivationHistory history) {
        HistoryJpaEntity entity;
        if (history.getId() != null) {
            entity = repository.findById(history.getId())
                    .orElseThrow(() -> new IllegalArgumentException("히스토리를 찾을 수 없습니다."));
            entity.update(history.getContent(), history.getHistoryType());
        } else {
            entity = HistoryJpaEntity.builder()
                    .farmId(history.getFarmId())
                    .historyType(history.getHistoryType())
                    .content(history.getContent())
                    .build();
        }
        repository.save(entity);
    }

    @Override
    public List<CultivationHistory> loadHistoriesByFarmId(Long farmId) {
        return repository.findByFarmIdOrderByCreatedAtDesc(farmId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CultivationHistory> loadHistoryById(Long historyId) {
        return repository.findById(historyId).map(this::mapToDomain);
    }

    @Override
    public void deleteHistory(Long historyId) {
        repository.deleteById(historyId);
    }

    private CultivationHistory mapToDomain(HistoryJpaEntity entity) {
        return CultivationHistory.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .historyType(entity.getHistoryType())
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now())
                .build();
    }
}
