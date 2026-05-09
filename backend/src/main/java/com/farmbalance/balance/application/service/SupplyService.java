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

@Service
@RequiredArgsConstructor
public class SupplyService implements CalculateSupplyRatioUseCase {

    private final LoadCropStatsPort loadCropStatsPort;
    private final LoadFarmSupplyPort loadFarmSupplyPort;

    @Override
    @Transactional(readOnly = true)
    public SupplyRatioResult calculateSupplyRatio(String cropName, Integer year) {
        // 1. KOSIS 기준 생산량 조회 (양평군 코드: YP)
        CropProductionStats stats = loadCropStatsPort.loadCropStats(cropName, year, "YP")
                .orElse(null);

        // 1-1. 지정된 연도에 통계가 없으면 최신 연도로 Fallback
        if (stats == null) {
            stats = loadCropStatsPort.loadLatestCropStats(cropName, "YP")
                    .orElse(null);
        }

        if (stats == null || stats.getTotalProduction() == null || stats.getTotalProduction() <= 0) {
            return new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, year);
        }

        Integer baseYear = stats.getYear();

        // KOSIS 통계는 톤 단위일 가능성이 높음. (DB에는 '톤'으로 저장됨)
        double standardYieldKg = stats.getTotalProduction();
        if ("톤".equals(stats.getUnitNm())) {
            standardYieldKg *= 1000; // 톤 -> kg 변환
        }

        // 2. 현재 농가들의 신청량(예상 수확량) 합계 조회 (kg 단위)
        Double currentSupplyKg = loadFarmSupplyPort.sumEstimatedYieldByCropName(cropName);

        if (currentSupplyKg == null || currentSupplyKg <= 0) {
            return new SupplyRatioResult(0.0, BalanceStatus.UNKNOWN, baseYear);
        }

        // 3. 수급 비율 계산 (%) 및 위기 단계 판별
        double ratio = (currentSupplyKg / standardYieldKg) * 100.0;
        BalanceStatus status = BalanceStatus.calculateFromRatio(ratio);
        
        return new SupplyRatioResult(ratio, status, baseYear);
    }
}
