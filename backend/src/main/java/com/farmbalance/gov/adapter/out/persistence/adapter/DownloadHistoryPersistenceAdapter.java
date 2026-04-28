package com.farmbalance.gov.adapter.out.persistence.adapter;

import com.farmbalance.gov.adapter.out.persistence.entity.DownloadHistoryJpaEntity;
import com.farmbalance.gov.adapter.out.persistence.repository.DownloadHistoryRepository;
import com.farmbalance.gov.application.port.out.DownloadHistoryPort;
import com.farmbalance.gov.domain.model.DownloadHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 다운로드 이력 Driven Adapter — JPA Entity ↔ Domain 변환
 */
@Component
@RequiredArgsConstructor
public class DownloadHistoryPersistenceAdapter implements DownloadHistoryPort {

    private final DownloadHistoryRepository repository;

    @Override
    public void save(DownloadHistory history) {
        repository.save(DownloadHistoryJpaEntity.builder()
                .userId(history.getUserId())
                .type(history.getType())
                .format(history.getFormat())
                .startDate(history.getStartDate())
                .endDate(history.getEndDate())
                .town(history.getTown())
                .build());
    }

    @Override
    public List<DownloadHistory> findRecentByUserId(Long userId, int limit) {
        return repository.findTop10ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(e -> DownloadHistory.builder()
                        .id(e.getId())
                        .userId(e.getUserId())
                        .type(e.getType())
                        .format(e.getFormat())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .town(e.getTown())
                        .createdAt(e.getCreatedAt())
                        .build())
                .toList();
    }
}
