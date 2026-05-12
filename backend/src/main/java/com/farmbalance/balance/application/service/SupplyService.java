package com.farmbalance.balance.application.service;

import com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase;
import com.farmbalance.balance.application.port.out.LoadCropStatsPort;
import com.farmbalance.balance.application.port.out.LoadFarmSupplyPort;
import com.farmbalance.balance.domain.BalanceStatus;
import com.farmbalance.balance.domain.CropProductionStats;
import com.farmbalance.balance.domain.SupplyRatioResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplyService implements CalculateSupplyRatioUseCase {

    private final LoadCropStatsPort loadCropStatsPort;
    private final LoadFarmSupplyPort loadFarmSupplyPort;

    @Override
    @Transactional(readOnly = true)
    public SupplyRatioResult calculateSupplyRatio(String cropName, Integer year) {
        // ... (기존 로직 유지)
        CropProductionStats stats = loadCropStatsPort.loadCropStats(cropName, year, "YP")
                .orElse(null);

        if (stats == null) {
            stats = loadCropStatsPort.loadLatestCropStats(cropName, "YP")
                    .orElse(null);
        }

        if (stats == null || stats.getTotalProduction() == null || stats.getTotalProduction() <= 0) {
            return new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, year);
        }

        Integer baseYear = stats.getYear();
        double standardYieldKg = stats.getTotalProduction();
        if ("톤".equals(stats.getUnitNm())) {
            standardYieldKg *= 1000;
        }

        Double currentSupplyKg = loadFarmSupplyPort.sumEstimatedYieldByCropName(cropName);

        if (currentSupplyKg == null || currentSupplyKg <= 0) {
            return new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, baseYear);
        }

        double ratio = (currentSupplyKg / standardYieldKg) * 100.0;
        BalanceStatus status = BalanceStatus.calculateFromRatio(ratio);
        
        return new SupplyRatioResult(ratio, status, baseYear);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, SupplyRatioResult> calculateAllSupplyRatios(Integer year) {
        List<String> cropNames = loadCropStatsPort.loadAllCropNames();
        Map<String, SupplyRatioResult> results = new HashMap<>();

        for (String cropName : cropNames) {
            SupplyRatioResult result = calculateSupplyRatio(cropName, year);
            if (result.getStatus() != BalanceStatus.UNKNOWN) {
                results.put(cropName, result);
            }
        }
        return results;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public SupplyRatioResult recalculate(String cropName) {
        // 실시간 계산 수행 (현재는 로그만 남기지만, 추후 요약 테이블이나 캐시 갱신 로직이 여기에 들어갑니다)
        SupplyRatioResult result = calculateSupplyRatio(cropName, null);
        
        System.out.println("[Recalculate-Core] " + cropName + "의 최신 수급 비율: " + result.getRatio() + "% (" + result.getStatus() + ")");
        
        // TODO: 결과를 CropBalanceSummary 테이블 등에 저장하여 대시보드 조회 성능 최적화 가능
        return result;
    }

    @Override
    @org.springframework.cache.annotation.Cacheable(value = "supplyTrends", key = "#cropName")
    public java.util.List<com.farmbalance.balance.domain.SupplyTrendResult> getSupplyTrend(String cropName) {
        // 1. 과거 통계 데이터 조회 (KOSIS)
        java.util.List<CropProductionStats> history = loadCropStatsPort.loadHistoricalStats(cropName, "YP");
        
        // 2. 현재 실시간 공급량 조회
        Double rawSupplyKg = loadFarmSupplyPort.sumEstimatedYieldByCropName(cropName);
        Double currentSupplyKg = (rawSupplyKg != null) ? rawSupplyKg : 0.0;
        int currentYear = java.time.LocalDate.now().getYear();

        java.util.List<com.farmbalance.balance.domain.SupplyTrendResult> trend = new java.util.ArrayList<>();
        
        if (!history.isEmpty()) {
            int startYear = history.get(0).getYear();
            java.util.Map<Integer, CropProductionStats> historyMap = history.stream()
                    .collect(java.util.stream.Collectors.toMap(
                        CropProductionStats::getYear, 
                        h -> h,
                        (existing, replacement) -> existing
                    ));

            System.out.println("[Trend-Service] " + cropName + " 추이 분석 시작: " + startYear + " ~ " + (currentYear - 1));

            for (int y = startYear; y < currentYear; y++) {
                CropProductionStats stats = historyMap.get(y);
                if (stats != null) {
                    Double factor = "톤".equals(stats.getUnitNm()) ? 1000.0 : 1.0;
                    Double prod = (stats.getTotalProduction() != null) ? stats.getTotalProduction() : 0.0;
                    Double demandKg = prod * factor;
                    
                    trend.add(com.farmbalance.balance.domain.SupplyTrendResult.builder()
                            .year(y)
                            .supply(demandKg)
                            .demand(demandKg)
                            .ratio(100.0)
                            .status(BalanceStatus.BALANCED)
                            .build());
                } else {
                    trend.add(com.farmbalance.balance.domain.SupplyTrendResult.builder()
                            .year(y)
                            .supply(0.0)
                            .demand(0.0)
                            .ratio(0.0)
                            .status(BalanceStatus.UNKNOWN)
                            .build());
                }
            }
        }

        Double latestTargetDemand = 0.0;
        if (!history.isEmpty()) {
            CropProductionStats latestStats = history.get(history.size() - 1);
            Double factor = "톤".equals(latestStats.getUnitNm()) ? 1000.0 : 1.0;
            Double latestProd = (latestStats.getTotalProduction() != null) ? latestStats.getTotalProduction() : 0.0;
            latestTargetDemand = latestProd * factor;
        }

        Double currentRatio = (latestTargetDemand > 0) ? (currentSupplyKg / latestTargetDemand) * 100.0 : 0.0;

        trend.add(com.farmbalance.balance.domain.SupplyTrendResult.builder()
                .year(currentYear)
                .supply(currentSupplyKg)
                .demand(latestTargetDemand)
                .ratio(currentRatio)
                .status(calculateStatus(currentRatio))
                .build());

        return trend;
    }

    private BalanceStatus calculateStatus(Double ratio) {
        if (ratio == 0) return BalanceStatus.UNKNOWN;
        if (ratio > 150) return BalanceStatus.EXCESS_WARN;
        if (ratio > 120) return BalanceStatus.EXCESS_CAUTION;
        if (ratio > 80) return BalanceStatus.BALANCED;
        if (ratio > 50) return BalanceStatus.SHORT_CAUTION;
        return BalanceStatus.SHORT_WARN;
    }
}
