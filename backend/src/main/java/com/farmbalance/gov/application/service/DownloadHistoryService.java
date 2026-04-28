package com.farmbalance.gov.application.service;

import com.farmbalance.gov.application.port.in.GetDownloadHistoryUseCase;
import com.farmbalance.gov.application.port.out.DownloadHistoryPort;
import com.farmbalance.gov.domain.model.DownloadHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 다운로드 이력 서비스
 */
@Service
@RequiredArgsConstructor
public class DownloadHistoryService implements GetDownloadHistoryUseCase {

    private final DownloadHistoryPort historyPort;

    @Override
    public List<DownloadHistory> getRecentHistory(Long userId) {
        return historyPort.findRecentByUserId(userId, 10);
    }
}
