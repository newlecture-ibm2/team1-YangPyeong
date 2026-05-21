package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.LoadRecommendHistoryPort;
import com.farmbalance.recommend.application.port.out.SaveRecommendHistoryPort;
import com.farmbalance.recommend.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
                .recommendMode(result.getRecommendMode() != null ? result.getRecommendMode().name() : null)
                .generatedAt(result.getGeneratedAt())
                .build();

        if (result.getCurrentCropAdvices() != null) {
            for (CropRecommendation rec : result.getCurrentCropAdvices()) {
                entity.addItem(toItemEntity(rec));
            }
        }
        if (result.getRecommendations() != null) {
            for (CropRecommendation rec : result.getRecommendations()) {
                entity.addItem(toItemEntity(rec));
            }
        }

        historyRepository.save(entity);
    }

    private RecommendHistoryItemEntity toItemEntity(CropRecommendation rec) {
        return RecommendHistoryItemEntity.builder()
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
                .pests(rec.getPests() != null ? String.join(",", rec.getPests()) : null)
                .adviceType(rec.getAdviceType() != null ? rec.getAdviceType().name() : null)
                .mismatchNote(rec.getMismatchNote())
                .build();
    }

    @Override
    public List<RecommendResult> loadByFarmId(Long farmId) {
        return historyRepository.findTop20ByFarmIdOrderByGeneratedAtDesc(farmId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RecommendResult> loadLatestByFarmId(Long farmId) {
        return historyRepository.findFirstByFarmIdOrderByGeneratedAtDesc(farmId)
                .map(this::mapToDomain);
    }

    private RecommendResult mapToDomain(RecommendHistoryEntity entity) {
        List<CropRecommendation> currentCropAdvices = new ArrayList<>();
        List<CropRecommendation> recommendations = new ArrayList<>();
        Set<String> seenCoaching = new HashSet<>();
        Set<Long> seenRecommendations = new HashSet<>();

        for (RecommendHistoryItemEntity item : entity.getItems()) {
            CropRecommendation rec = mapItemToRecommendation(item);
            AdviceType type = AdviceType.fromString(item.getAdviceType());
            if (type == AdviceType.IN_SEASON_COACHING || type == AdviceType.PLANNED_CROP) {
                String coachingKey = rec.getCropId() + ":" + (type != null ? type.name() : "");
                if (!seenCoaching.add(coachingKey)) {
                    continue;
                }
                currentCropAdvices.add(rec);
            } else {
                if (!seenRecommendations.add(rec.getCropId())) {
                    continue;
                }
                recommendations.add(rec);
            }
        }

        return RecommendResult.builder()
                .farmId(entity.getFarmId())
                .farmName(entity.getFarmName())
                .farmAddress(entity.getFarmAddress())
                .farmArea(entity.getFarmArea())
                .soilPh(entity.getSoilPh())
                .organicMatter(entity.getOrganicMatter())
                .soilType(entity.getSoilType())
                .recommendMode(RecommendMode.fromString(entity.getRecommendMode()))
                .currentCropAdvices(currentCropAdvices)
                .recommendations(recommendations)
                .generatedAt(entity.getGeneratedAt())
                .build();
    }

    private CropRecommendation mapItemToRecommendation(RecommendHistoryItemEntity item) {
        return CropRecommendation.builder()
                .rank(item.getRank())
                .cropId(item.getCropId())
                .cropName(item.getCropName())
                .category(CropCategory.fromLabel(item.getCategory()))
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
                .pests(parsePests(item.getPests()))
                .adviceType(AdviceType.fromString(item.getAdviceType()))
                .mismatchNote(item.getMismatchNote())
                .build();
    }

    private List<String> parsePests(String pests) {
        if (pests == null || pests.isBlank()) return new ArrayList<>();
        return Arrays.stream(pests.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private <E extends Enum<E>> E safeParseEnum(Class<E> enumClass, String value) {
        if (value == null) return null;
        try {
            return Enum.valueOf(enumClass, value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
