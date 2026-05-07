package com.farmbalance.recommend.adapter.in.web.dto;

import com.farmbalance.recommend.domain.*;

import lombok.Builder;
import lombok.Getter;

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
    private List<CropItem> recommendations;
    private String generatedAt;

    /** 도메인 → DTO 변환 */
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

        List<CropItem> items = result.getRecommendations().stream()
                .map(CropItem::from)
                .collect(Collectors.toList());

        return RecommendResponse.builder()
                .farmInfo(farmInfo)
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

        public static CropItem from(CropRecommendation rec) {
            return CropItem.builder()
                    .rank(rec.getRank())
                    .cropId(rec.getCropId())
                    .cropName(rec.getCropName())
                    .category(rec.getCategory().getLabel())
                    .score(rec.getScore())
                    .soilFitness(rec.getSoilFitness().name())
                    .soilFitnessPercent(rec.getSoilFitnessPercent())
                    .priceForecastPercent(rec.getPriceForecastPercent())
                    .supplyStabilityPercent(rec.getSupplyStabilityPercent())
                    .supplyStatus(rec.getSupplyStatus().name())
                    .expectedRevenuePerKg(rec.getExpectedRevenuePerKg())
                    .expectedYield(rec.getExpectedYield())
                    .aiReason(rec.getAiReason())
                    .growthDays(rec.getGrowthDays())
                    .optimalTemp(rec.getOptimalTemp())
                    .sowingPeriod(rec.getSowingPeriod())
                    .harvestPeriod(rec.getHarvestPeriod())
                    .difficulty(rec.getDifficulty())
                    .pests(rec.getPests())
                    .build();
        }
    }
}
