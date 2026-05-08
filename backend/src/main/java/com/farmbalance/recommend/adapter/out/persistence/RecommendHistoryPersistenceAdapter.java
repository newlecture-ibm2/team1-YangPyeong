package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.LoadRecommendHistoryPort;
import com.farmbalance.recommend.application.port.out.SaveRecommendHistoryPort;
import com.farmbalance.recommend.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RecommendHistoryPersistenceAdapter implements SaveRecommendHistoryPort, LoadRecommendHistoryPort {

    private final RecommendHistoryRepository historyRepository;

    @Override
    public void save(RecommendResult result) {
        RecommendHistoryEntity entity = RecommendHistoryEntity.builder()
                .farmId(result.getFarmId())
                .farmName(result.getFarmName())
                .farmAddress(result.getFarmAddress())
                .farmArea(result.getFarmArea())
                .soilPh(result.getSoilPh())
                .organicMatter(result.getOrganicMatter())
                .soilType(result.getSoilType())
                .generatedAt(result.getGeneratedAt())
                .build();

        for (CropRecommendation rec : result.getRecommendations()) {
            RecommendHistoryItemEntity item = RecommendHistoryItemEntity.builder()
                    .cropId(rec.getCropId())
                    .cropName(rec.getCropName())
                    .category(rec.getCategory() != null ? rec.getCategory().getLabel() : null)
                    .rank(rec.getRank())
                    .score(rec.getScore())
                    .soilFitness(rec.getSoilFitness() != null ? rec.getSoilFitness().name() : null)
                    .soilFitnessPercent(rec.getSoilFitnessPercent())
                    .priceForecastPercent(rec.getPriceForecastPercent())
                    .supplyStabilityPercent(rec.getSupplyStabilityPercent())
                    .supplyStatus(rec.getSupplyStatus() != null ? rec.getSupplyStatus().name() : null)
                    .expectedRevenuePerKg(rec.getExpectedRevenuePerKg())
                    .expectedYield(rec.getExpectedYield())
                    .aiReason(rec.getAiReason())
                    .difficulty(rec.getDifficulty())
                    .growthDays(rec.getGrowthDays())
                    .optimalTemp(rec.getOptimalTemp())
                    .sowingPeriod(rec.getSowingPeriod())
                    .harvestPeriod(rec.getHarvestPeriod())
                    .build();
            entity.addItem(item);
        }

        historyRepository.save(entity);
    }

    @Override
    public List<RecommendResult> loadByFarmId(Long farmId) {
        return historyRepository.findByFarmIdOrderByGeneratedAtDesc(farmId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RecommendResult> loadLatestByFarmId(Long farmId) {
        return historyRepository.findFirstByFarmIdOrderByGeneratedAtDesc(farmId)
                .map(this::mapToDomain);
    }

    private RecommendResult mapToDomain(RecommendHistoryEntity entity) {
        List<CropRecommendation> recommendations = entity.getItems().stream()
                .map(item -> CropRecommendation.builder()
                        .rank(item.getRank())
                        .cropId(item.getCropId())
                        .cropName(item.getCropName())
                        .category(mapCategory(item.getCategory()))
                        .score(item.getScore())
                        .soilFitness(safeParseEnum(SoilFitness.class, item.getSoilFitness()))
                        .soilFitnessPercent(item.getSoilFitnessPercent())
                        .priceForecastPercent(item.getPriceForecastPercent())
                        .supplyStabilityPercent(item.getSupplyStabilityPercent())
                        .supplyStatus(safeParseEnum(SupplyStatus.class, item.getSupplyStatus()))
                        .expectedRevenuePerKg(item.getExpectedRevenuePerKg())
                        .expectedYield(item.getExpectedYield())
                        .aiReason(item.getAiReason())
                        .difficulty(item.getDifficulty())
                        .growthDays(item.getGrowthDays())
                        .optimalTemp(item.getOptimalTemp())
                        .sowingPeriod(item.getSowingPeriod())
                        .harvestPeriod(item.getHarvestPeriod())
                        .pests(new ArrayList<>()) // History doesn't save pests currently
                        .build())
                .collect(Collectors.toList());

        return RecommendResult.builder()
                .farmId(entity.getFarmId())
                .farmName(entity.getFarmName())
                .farmAddress(entity.getFarmAddress())
                .farmArea(entity.getFarmArea())
                .soilPh(entity.getSoilPh())
                .organicMatter(entity.getOrganicMatter())
                .soilType(entity.getSoilType())
                .generatedAt(entity.getGeneratedAt())
                .recommendations(recommendations)
                .build();
    }

    private CropCategory mapCategory(String label) {
        if (label == null) return CropCategory.VEGETABLE;
        for (CropCategory cat : CropCategory.values()) {
            if (cat.getLabel().equals(label)) return cat;
        }
        return CropCategory.VEGETABLE;
    }

    /** enum 문자열 → enum 안전 변환 (불일치 시 null 반환) */
    private <E extends Enum<E>> E safeParseEnum(Class<E> enumClass, String value) {
        if (value == null) return null;
        try {
            return Enum.valueOf(enumClass, value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
