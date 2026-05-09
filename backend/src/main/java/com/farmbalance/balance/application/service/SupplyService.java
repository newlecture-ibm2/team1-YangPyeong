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
}
