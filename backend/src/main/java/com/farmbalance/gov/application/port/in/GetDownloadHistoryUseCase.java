package com.farmbalance.gov.application.port.in;

import com.farmbalance.gov.domain.model.DownloadHistory;

import java.util.List;

/**
 * 다운로드 이력 조회 UseCase
 */
public interface GetDownloadHistoryUseCase {

    /** 사용자별 최신 10건 조회 */
    List<DownloadHistory> getRecentHistory(Long userId);
}
