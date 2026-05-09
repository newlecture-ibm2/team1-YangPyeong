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
}
