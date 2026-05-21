package com.farmbalance.recommend.adapter.in.web.dto;

import com.farmbalance.recommend.domain.*;

import lombok.Builder;
import lombok.Getter;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 추천 API 응답 DTO
 * 프론트엔드의 CropRecommendResponse와 1:1 대응
 */
@Getter
@Builder
public class RecommendResponse {

    private FarmInfo farmInfo;
    private String recommendMode;
    private List<CropItem> currentCropAdvices;
    private List<CropItem> recommendations;
    private String generatedAt;

    public static RecommendResponse from(RecommendResult result) {
        FarmInfo farmInfo = FarmInfo.builder()
                .id(result.getFarmId())
                .name(result.getFarmName())
                .address(result.getFarmAddress())
                .area(result.getFarmArea())
                .soilPh(result.getSoilPh())
                .organicMatter(result.getOrganicMatter())
                .soilType(result.getSoilType())
                .build();

        List<CropItem> coaching = result.getCurrentCropAdvices() != null
                ? result.getCurrentCropAdvices().stream().map(CropItem::from).collect(Collectors.toList())
                : Collections.emptyList();
        List<CropItem> items = result.getRecommendations() != null
                ? result.getRecommendations().stream().map(CropItem::from).collect(Collectors.toList())
                : Collections.emptyList();

        return RecommendResponse.builder()
                .farmInfo(farmInfo)
                .recommendMode(result.getRecommendMode() != null ? result.getRecommendMode().name() : "PLAN")
                .currentCropAdvices(coaching)
                .recommendations(items)
                .generatedAt(result.getGeneratedAt() != null ? result.getGeneratedAt().toString() : null)
                .build();
    }

    @Getter
    @Builder
    public static class FarmInfo {
        private Long id;
        private String name;
        private String address;
        private Double area;
        private Double soilPh;
        private Double organicMatter;
        private String soilType;
    }

    @Getter
    @Builder
    public static class CropItem {
        private int rank;
        private Long cropId;
        private String cropName;
        private String category;
        private int score;
        private String soilFitness;
        private int soilFitnessPercent;
        private int priceForecastPercent;
        private int supplyStabilityPercent;
        private String supplyStatus;
        private int expectedRevenuePerKg;
        private Integer expectedYield;
        private String aiReason;
        private Integer growthDays;
        private String optimalTemp;
        private String sowingPeriod;
        private String harvestPeriod;
        private Integer difficulty;
        private List<String> pests;
        private String adviceType;
        private String mismatchNote;
        private Long registrationId;
        private String aiCoachingStatus;
        private String aiCoachingHint;

        public static CropItem from(CropRecommendation rec) {
            return CropItem.builder()
                    .rank(rec.getRank())
                    .cropId(rec.getCropId())
                    .cropName(rec.getCropName())
                    .category(rec.getCategory() != null ? rec.getCategory().getLabel() : null)
                    .score(rec.getScore())
                    .soilFitness(rec.getSoilFitness() != null ? rec.getSoilFitness().name() : null)
                    .soilFitnessPercent(rec.getSoilFitnessPercent())
                    .priceForecastPercent(rec.getPriceForecastPercent())
                    .supplyStabilityPercent(rec.getSupplyStabilityPercent())
                    .supplyStatus(rec.getSupplyStatus() != null ? rec.getSupplyStatus().name() : null)
                    .expectedRevenuePerKg(rec.getExpectedRevenuePerKg())
                    .expectedYield(rec.getExpectedYield())
                    .aiReason(rec.getAiReason())
                    .growthDays(rec.getGrowthDays())
                    .optimalTemp(rec.getOptimalTemp())
                    .sowingPeriod(rec.getSowingPeriod())
                    .harvestPeriod(rec.getHarvestPeriod())
                    .difficulty(rec.getDifficulty())
                    .pests(rec.getPests())
                    .adviceType(rec.getAdviceType() != null ? rec.getAdviceType().name() : null)
                    .mismatchNote(rec.getMismatchNote())
                    .registrationId(rec.getRegistrationId())
                    .aiCoachingStatus(rec.getAiCoachingStatus())
                    .aiCoachingHint(rec.getAiCoachingHint())
                    .build();
        }
    }
}
