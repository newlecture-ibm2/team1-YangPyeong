package com.farmbalance.balance.application.service;

import com.farmbalance.balance.adapter.in.web.dto.BalanceDashboardResponse;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplyService implements CalculateSupplyRatioUseCase {

    private static final java.util.Set<String> OFFICIAL_CROPS = java.util.Set.of("감자", "고구마", "고추", "메밀", "방울토마토");

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
            Double currentSupplyKg = loadFarmSupplyPort.sumEstimatedYieldByCropName(cropName);
            double actualSupply = (currentSupplyKg != null) ? currentSupplyKg : 0.0;
            int targetYear = (year != null) ? year : java.time.LocalDate.now().getYear();
            return new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, targetYear, actualSupply, 0.0);
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
        
        System.out.printf("[Balance-Analysis] 작물: %s, 공급량: %.1fkg, 기준량: %.1fkg, 비율: %.1f%% (%s)%n", 
                cropName, actualSupply, standardYieldKg, ratio, status.getDescription());
        
        return new SupplyRatioResult(ratio, status, baseYear, actualSupply, standardYieldKg);
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

        Map<String, CropProductionStats> statsMap = new HashMap<>();
        for (CropProductionStats stats : allStats) {
            String cropName = stats.getItmNm();
            
            statsMap.put(cropName, stats);
            
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
            
            results.put(cropName, new SupplyRatioResult(ratio, status, stats.getYear(), actualSupply, standardYieldKg));
        }

        // KOSIS 통계청 대표 작물에 없는 "온디맨드(On-demand) 작물" 추가
        int targetYear = (year != null) ? year : java.time.LocalDate.now().getYear();
        for (Map.Entry<String, Double> entry : allSupplies.entrySet()) {
            String cropName = entry.getKey();
            if (!statsMap.containsKey(cropName)) {
                double actualSupply = entry.getValue();
                results.put(cropName, new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, targetYear, actualSupply, 0.0));
            }
        }
        
        long endTime = System.currentTimeMillis();
        System.out.printf("[Balance-Optimization] 전체 수급 분석 완료 (작물 수: %d, 소요시간: %dms)%n", 
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

    // ========== 읍면동 대시보드 ==========

    @Override
    @Transactional(readOnly = true)
    public BalanceDashboardResponse getDashboard(Long userId, String townCode) {
        String regionCode = balanceProperties.getRegion().getDefaultCode();
        BalanceProperties.Thresholds thresholds = balanceProperties.getThresholds();

        // 1. 유저가 소유한 농장들의 읍면동 목록 조회
        List<String[]> rawTowns = loadFarmSupplyPort.findTownsByUserId(userId);
        List<BalanceDashboardResponse.TownInfo> userTowns = rawTowns.stream()
                .map(t -> BalanceDashboardResponse.TownInfo.builder()
                        .code(t[0])
                        .name(t[1])
                        .build())
                .toList();

        // 2. 선택된 읍면동 결정 (폴백 로직)
        String selectedCode;
        String selectedName;

        if (townCode != null && !townCode.isBlank()) {
            // 클라이언트가 명시적으로 지정한 경우
            selectedCode = townCode;
            selectedName = userTowns.stream()
                    .filter(t -> t.getCode().equals(townCode))
                    .map(BalanceDashboardResponse.TownInfo::getName)
                    .findFirst()
                    .orElseGet(() -> resolveTownNameByCode(townCode));
        } else if (!userTowns.isEmpty()) {
            // 농장이 있는 경우 → 첫 번째 읍면동 자동 선택
            selectedCode = userTowns.get(0).getCode();
            selectedName = userTowns.get(0).getName();
        } else {
            // 농장 미등록 신규 가입자 → 양평군 전체로 폴백
            selectedCode = null;
            selectedName = "양평군 전체";
        }

        // 3. 양평군 전체 수급 현황 계산
        BalanceDashboardResponse.SupplySummary totalSummary = buildSupplySummary(
                "양평군 전체", null, regionCode, thresholds);

        // 4. 읍면동(우리 동네) 수급 현황 계산
        BalanceDashboardResponse.SupplySummary townSummary;
        if (selectedCode != null) {
            townSummary = buildSupplySummary(selectedName, selectedCode, regionCode, thresholds);
        } else {
            // 농장 미등록 → 전체와 동일하게 표시
            townSummary = totalSummary;
        }

        return BalanceDashboardResponse.builder()
                .userTowns(userTowns)
                .selectedTownCode(selectedCode)
                .selectedTownName(selectedName)
                .townSummary(townSummary)
                .totalSummary(totalSummary)
                .build();
    }

    private String resolveTownNameByCode(String townCode) {
        if (townCode == null) return "선택된 지역";
        return switch (townCode) {
            case "4183010" -> "양평읍";
            case "4183020" -> "강상면";
            case "4183030" -> "강하면";
            case "4183040" -> "양서면";
            case "4183050" -> "옥천면";
            case "4183060" -> "서종면";
            case "4183070" -> "단월면";
            case "4183080" -> "청운면";
            case "4183090" -> "양동면";
            case "4183100" -> "지평면";
            case "4183110" -> "용문면";
            case "4183120" -> "개군면";
            default -> "선택된 지역";
        };
    }

    /**
     * 수급 요약 정보를 빌드합니다.
     *
     * @param label 표시 라벨 (예: "용문면", "양평군 전체")
     * @param townCode 읍면동 코드 (null이면 양평군 전체)
     * @param regionCode 양평군 지역코드
     * @param thresholds 수급 판정 기준치
     */
    private BalanceDashboardResponse.SupplySummary buildSupplySummary(
            String label, String townCode, String regionCode,
            BalanceProperties.Thresholds thresholds) {

        // 1. 공급량 데이터: 읍면동 vs 전체
        Map<String, Double> supplies;
        int farmCount;
        if (townCode != null) {
            supplies = loadFarmSupplyPort.sumEstimatedYieldsByTownCode(townCode);
            farmCount = loadFarmSupplyPort.countFarmsByTownCode(townCode);
        } else {
            supplies = loadFarmSupplyPort.sumAllEstimatedYields();
            farmCount = 0; // 전체 농가 수는 별도 카운트하지 않음
        }

        // 2. KOSIS 기준 통계 (양평군 전체 기준)
        List<CropProductionStats> allStats = loadCropStatsPort.loadAllLatestCropStats(regionCode);
        Map<String, CropProductionStats> statsMap = new HashMap<>();

        // 3. 작물별 수급 아이템 빌드
        List<BalanceDashboardResponse.CropSupplyItem> cropItems = new ArrayList<>();

        for (CropProductionStats stats : allStats) {
            String cropName = stats.getItmNm();

            statsMap.put(cropName, stats);

            double standardYieldKg = stats.getTotalProduction().doubleValue();
            if (YieldUnit.TON.getLabel().equals(stats.getUnitNm())) {
                standardYieldKg *= YieldUnit.TON.getFactorToKg();
            }
            
            // 읍면동 단위일 경우 실제 통계청 농가 사업체 수 가중치를 적용하여 수요량 분배
            if (townCode != null && label != null) {
                try {
                    com.farmbalance.balance.domain.YangpyeongRegion region = com.farmbalance.balance.domain.YangpyeongRegion.fromHangulName(label);
                    standardYieldKg = standardYieldKg * region.getWeight();
                } catch (IllegalArgumentException e) {
                    // 매칭 실패 시 기본값(1/12)으로 폴백
                    standardYieldKg = standardYieldKg / 12.0;
                }
            }

            if (standardYieldKg <= 0) continue;

            double currentSupplyKg = supplies.getOrDefault(cropName, 0.0);

            // 소수점 2째 자리 부동소수점 오차 보정 (Math.round)
            currentSupplyKg = Math.round(currentSupplyKg * 100.0) / 100.0;
            standardYieldKg = Math.round(standardYieldKg * 100.0) / 100.0;

            double ratio = (standardYieldKg > 0) ? (currentSupplyKg / standardYieldKg) * 100.0 : 0.0;
            ratio = Math.round(ratio * 10.0) / 10.0;

            BalanceStatus status = BalanceStatus.calculateFromRatio(ratio,
                    thresholds.getExcessWarn(),
                    thresholds.getExcessCaution(),
                    thresholds.getShortCaution(),
                    thresholds.getShortWarn());

            cropItems.add(BalanceDashboardResponse.CropSupplyItem.builder()
                    .cropName(cropName)
                    .currentSupplyKg(currentSupplyKg)
                    .standardYieldKg(standardYieldKg)
                    .supplyRatio(ratio)
                    .status(status.name())
                    .statusLabel(status.getLabel())
                    .build());
        }

        // KOSIS 통계청 대표 작물에 없는 "온디맨드(On-demand) 작물" 추가
        for (Map.Entry<String, Double> entry : supplies.entrySet()) {
            String cropName = entry.getKey();
            if (!statsMap.containsKey(cropName)) {
                double currentSupplyKg = entry.getValue();
                currentSupplyKg = Math.round(currentSupplyKg * 100.0) / 100.0;

                cropItems.add(BalanceDashboardResponse.CropSupplyItem.builder()
                        .cropName(cropName)
                        .currentSupplyKg(currentSupplyKg)
                        .standardYieldKg(0.0)
                        .supplyRatio(0.0)
                        .status("UNKNOWN")
                        .statusLabel("농가 집계 진행중")
                        .build());
            }
        }

        return BalanceDashboardResponse.SupplySummary.builder()
                .label(label)
                .farmCount(farmCount)
                .crops(cropItems)
                .build();
    }

}

