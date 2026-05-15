package com.farmbalance.recommend.application.support;

import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.application.port.out.LoadSupplyStatusPort;
import com.farmbalance.recommend.application.port.out.RecommendPricePort;
import com.farmbalance.recommend.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class RecommendCropAnalysisHelper {

    private final LoadSupplyStatusPort loadSupplyStatusPort;
    private final RecommendPricePort recommendPricePort;

    public CropRecommendation buildFromCandidate(
            CropCandidateData candidate,
            FarmBasicData farm,
            String regionCode,
            RecommendScoreCalculator calculator,
            AdviceType adviceType
    ) {
        int soilPercent = calculator.calculateSoilFitness(
                farm.getPh(),
                farm.getOrganicMatter(),
                farm.getSoilType(),
                candidate.getOptimalPhMin(),
                candidate.getOptimalPhMax(),
                candidate.getOptimalOrganicMatter(),
                candidate.getPreferredSoilTypes());

        SupplyStatus supplyStatus = loadSupplyStatusPort.loadSupplyStatus(candidate.getCropId(), regionCode);
        int supplyPercent = supplyStatus != null ? supplyStatus.getStabilityScore() : 50;
        int pricePercent = candidate.getPriceForecastPercent();

        Integer kamisPrice = recommendPricePort.getRecentPricePerKg(candidate.getCropName());
        int expectedRevenue = kamisPrice != null ? kamisPrice : candidate.getExpectedRevenuePerKg();
        int difficulty = candidate.getDifficulty() != null ? candidate.getDifficulty() : 3;
        int score = calculator.calculate(soilPercent, pricePercent, supplyPercent, difficulty);
        CropCategory category = CropCategory.fromLabel(candidate.getCategory());

        return CropRecommendation.builder()
                .cropId(candidate.getCropId())
                .cropName(candidate.getCropName())
                .category(category)
                .score(score)
                .soilFitness(SoilFitness.fromPercent(soilPercent))
                .soilFitnessPercent(soilPercent)
                .priceForecastPercent(pricePercent)
                .supplyStabilityPercent(supplyPercent)
                .supplyStatus(supplyStatus)
                .expectedRevenuePerKg(expectedRevenue)
                .expectedYield(candidate.getExpectedYield())
                .growthDays(candidate.getGrowthDays())
                .optimalTemp(candidate.getOptimalTemp())
                .sowingPeriod(candidate.getSowingPeriod())
                .harvestPeriod(candidate.getHarvestPeriod())
                .difficulty(difficulty)
                .pests(candidate.getPests() != null ? Arrays.asList(candidate.getPests()) : List.of())
                .adviceType(adviceType)
                .build();
    }

    public Optional<CropCandidateData> findCandidate(List<CropCandidateData> candidates, Long cropId) {
        return candidates.stream().filter(c -> c.getCropId().equals(cropId)).findFirst();
    }

    /** 등록 작물 대비 토양 적합도가 가장 높은 다른 작물 */
    public MismatchInfo computeMismatch(
            CultivationContextItem registration,
            CropCandidateData currentCandidate,
            List<CropCandidateData> allCandidates,
            FarmBasicData farm,
            RecommendScoreCalculator calculator
    ) {
        int currentSoil = soilPercent(currentCandidate, farm, calculator);
        int bestSoil = currentSoil;
        String bestName = currentCandidate.getCropName();

        for (CropCandidateData c : allCandidates) {
            if (c.getCropId().equals(registration.getCropId())) {
                continue;
            }
            int soil = soilPercent(c, farm, calculator);
            if (soil > bestSoil) {
                bestSoil = soil;
                bestName = c.getCropName();
            }
        }

        if (bestSoil > currentSoil + 5 && !bestName.equals(currentCandidate.getCropName())) {
            String note = String.format(
                    "토양 최적 작물 %s(적합 %d%%)이 현재 %s(적합 %d%%)보다 유리합니다. 올해는 현재 작물 관리를 유지하고 전환은 다음 시즌을 검토하세요.",
                    bestName, bestSoil, currentCandidate.getCropName(), currentSoil);
            return new MismatchInfo(note, bestName, bestSoil, currentSoil);
        }
        return new MismatchInfo(null, bestName, bestSoil, currentSoil);
    }

    public String buildGlobalMismatchSummary(
            FarmCultivationContext ctx,
            List<CropCandidateData> candidates,
            FarmBasicData farm,
            RecommendScoreCalculator calculator
    ) {
        if (ctx == null || !ctx.hasRegistrations()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        for (CultivationContextItem item : ctx.getItems()) {
            findCandidate(candidates, item.getCropId()).ifPresent(c -> {
                MismatchInfo m = computeMismatch(item, c, candidates, farm, calculator);
                if (m.note() != null) {
                    parts.add(m.note());
                }
            });
        }
        return parts.isEmpty() ? null : String.join(" ", parts);
    }

    private int soilPercent(CropCandidateData candidate, FarmBasicData farm, RecommendScoreCalculator calculator) {
        return calculator.calculateSoilFitness(
                farm.getPh(),
                farm.getOrganicMatter(),
                farm.getSoilType(),
                candidate.getOptimalPhMin(),
                candidate.getOptimalPhMax(),
                candidate.getOptimalOrganicMatter(),
                candidate.getPreferredSoilTypes());
    }

    public record MismatchInfo(String note, String bestCropName, int bestSoilPercent, int currentSoilPercent) {}
}
