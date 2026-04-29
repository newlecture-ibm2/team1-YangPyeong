package com.farmbalance.gov.application.port.out;

import com.farmbalance.gov.domain.model.DownloadHistory;

import java.util.List;

/**
 * 다운로드 이력 저장/조회 Output Port
 */
public interface DownloadHistoryPort {

    /** 이력 저장 */
    void save(DownloadHistory history);

    /** 특정 사용자의 최신 N건 조회 */
    List<DownloadHistory> findRecentByUserId(Long userId, int limit);
}
