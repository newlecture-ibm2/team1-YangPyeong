package com.farmbalance.balance.application.service;

import com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase;
import com.farmbalance.balance.application.port.out.LoadCropStatsPort;
import com.farmbalance.balance.application.port.out.LoadFarmSupplyPort;
import com.farmbalance.balance.domain.BalanceStatus;
import com.farmbalance.balance.domain.CropProductionStats;
import com.farmbalance.balance.domain.SupplyRatioResult;
import com.farmbalance.balance.domain.YieldUnit;
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
    private final BalanceProperties balanceProperties;

    @Override
    @Transactional(readOnly = true)
    public SupplyRatioResult calculateSupplyRatio(String cropName, Integer year) {
        String regionCode = balanceProperties.getRegion().getDefaultCode();
        
        CropProductionStats stats = loadCropStatsPort.loadCropStats(cropName, year, regionCode)
                .orElse(null);

        if (stats == null) {
            stats = loadCropStatsPort.loadLatestCropStats(cropName, regionCode)
                    .orElse(null);
        }

        if (stats == null || stats.getTotalProduction() == null || stats.getTotalProduction().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, year);
        }

        Integer baseYear = stats.getYear();
        double standardYieldKg = stats.getTotalProduction().doubleValue();
        if (YieldUnit.TON.getLabel().equals(stats.getUnitNm())) {
            standardYieldKg *= YieldUnit.TON.getFactorToKg();
        }

        Double currentSupplyKg = loadFarmSupplyPort.sumEstimatedYieldByCropName(cropName);

        // 등록된 농장이 없더라도 0%로 계산하여 '부족' 상태를 보여줌
        double actualSupply = (currentSupplyKg != null) ? currentSupplyKg : 0.0;
        double ratio = (actualSupply / standardYieldKg) * 100.0;
        
        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();
        BalanceStatus status = BalanceStatus.calculateFromRatio(ratio, 
                thresholds.getExcessWarn(), 
                thresholds.getExcessCaution(), 
                thresholds.getShortCaution(), 
                thresholds.getShortWarn());
        
        System.out.printf("[Balance-Analysis] 작물: %s, 공급량: %.1fkg, 기준량: %.1fkg, 비율: %.1f%% (%s)\n", 
                cropName, actualSupply, standardYieldKg, ratio, status.getDescription());
        
        return new SupplyRatioResult(ratio, status, baseYear);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, SupplyRatioResult> calculateAllSupplyRatios(Integer year) {
        long startTime = System.currentTimeMillis();
        String regionCode = balanceProperties.getRegion().getDefaultCode();
        
        // 1. 모든 최신 통계 데이터 일괄 조회 (1번의 쿼리)
        List<CropProductionStats> allStats = loadCropStatsPort.loadAllLatestCropStats(regionCode);
        
        // 2. 모든 작물의 현재 공급량 일괄 조회 (1번의 쿼리)
        Map<String, Double> allSupplies = loadFarmSupplyPort.sumAllEstimatedYields();
        
        Map<String, SupplyRatioResult> results = new HashMap<>();
        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();

        for (CropProductionStats stats : allStats) {
            String cropName = stats.getItmNm();
            
            // 기준 생산량 계산 (Kg 단위)
            double standardYieldKg = stats.getTotalProduction().doubleValue();
            if (YieldUnit.TON.getLabel().equals(stats.getUnitNm())) {
                standardYieldKg *= YieldUnit.TON.getFactorToKg();
            }
            
            if (standardYieldKg <= 0) continue;

            // 현재 공급량 (등록된 정보가 없으면 0.0)
            double actualSupply = allSupplies.getOrDefault(cropName, 0.0);
            double ratio = (actualSupply / standardYieldKg) * 100.0;
            
            BalanceStatus status = BalanceStatus.calculateFromRatio(ratio, 
                    thresholds.getExcessWarn(), 
                    thresholds.getExcessCaution(), 
                    thresholds.getShortCaution(), 
                    thresholds.getShortWarn());
            
            results.put(cropName, new SupplyRatioResult(ratio, status, stats.getYear()));
        }
        
        long endTime = System.currentTimeMillis();
        System.out.printf("[Balance-Optimization] 전체 수급 분석 완료 (작물 수: %d, 소요시간: %dms)\n", 
                results.size(), (endTime - startTime));
        
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
        String regionCode = balanceProperties.getRegion().getDefaultCode();
        
        // 1. 과거 통계 데이터 조회 (KOSIS)
        java.util.List<CropProductionStats> history = loadCropStatsPort.loadHistoricalStats(cropName, regionCode);
        
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
                    Double factor = YieldUnit.TON.getLabel().equals(stats.getUnitNm()) ? YieldUnit.TON.getFactorToKg() : 1.0;
                    Double prod = (stats.getTotalProduction() != null) ? stats.getTotalProduction().doubleValue() : 0.0;
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
            Double factor = YieldUnit.TON.getLabel().equals(latestStats.getUnitNm()) ? YieldUnit.TON.getFactorToKg() : 1.0;
            Double latestProd = (latestStats.getTotalProduction() != null) ? latestStats.getTotalProduction().doubleValue() : 0.0;
            latestTargetDemand = latestProd * factor;
        }

        Double currentRatio = (latestTargetDemand > 0) ? (currentSupplyKg / latestTargetDemand) * 100.0 : 0.0;

        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();
        trend.add(com.farmbalance.balance.domain.SupplyTrendResult.builder()
                .year(currentYear)
                .supply(currentSupplyKg)
                .demand(latestTargetDemand)
                .ratio(currentRatio)
                .status(BalanceStatus.calculateFromRatio(currentRatio, 
                        thresholds.getExcessWarn(), 
                        thresholds.getExcessCaution(), 
                        thresholds.getShortCaution(), 
                        thresholds.getShortWarn()))
                .build());

        return trend;
    }

}
