package com.farmbalance.balance.application.port.out;

import com.farmbalance.balance.domain.CropProductionStats;
import java.util.List;
import java.util.Optional;

public interface LoadCropStatsPort {
    Optional<CropProductionStats> loadCropStats(String itmNm, Integer year, String regionCode);
    Optional<CropProductionStats> loadCropStats(String itmNm, Integer year);
    
    // 가장 최신 연도의 데이터 조회 (Fallback용)
    Optional<CropProductionStats> loadLatestCropStats(String itmNm, String regionCode);
    Optional<CropProductionStats> loadLatestCropStats(String itmNm);

    List<String> loadAllCropNames();
    List<CropProductionStats> loadHistoricalStats(String itmNm, String regionCode);
    
    /**
     * 특정 지역의 모든 작물에 대해 가장 최신 연도의 통계 데이터를 일괄 조회합니다.
     */
    List<CropProductionStats> loadAllLatestCropStats(String regionCode);
}
