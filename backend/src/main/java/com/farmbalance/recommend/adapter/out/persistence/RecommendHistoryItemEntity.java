package com.farmbalance.recommend.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recommend_history_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendHistoryItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "history_id")
    private RecommendHistoryEntity history;

    private Long cropId;
    private String cropName;
    private String category;
    @Column(name = "`rank`")
    private Integer rank;
    private Integer score;

    private String soilFitness;
    private Integer soilFitnessPercent;
    private Integer priceForecastPercent;
    private Integer supplyStabilityPercent;
    private String supplyStatus;

    private Integer expectedRevenuePerKg;
    private Integer expectedYield;
    private String aiReason;

    private Integer difficulty;
    private Integer growthDays;
    private String optimalTemp;
    private String sowingPeriod;
    private String harvestPeriod;

    @Builder
    public RecommendHistoryItemEntity(Long cropId, String cropName, String category, Integer rank, Integer score,
                                      String soilFitness, Integer soilFitnessPercent, Integer priceForecastPercent,
                                      Integer supplyStabilityPercent, String supplyStatus, Integer expectedRevenuePerKg,
                                      Integer expectedYield, String aiReason, Integer difficulty, Integer growthDays,
                                      String optimalTemp, String sowingPeriod, String harvestPeriod) {
        this.cropId = cropId;
        this.cropName = cropName;
        this.category = category;
        this.rank = rank;
        this.score = score;
        this.soilFitness = soilFitness;
        this.soilFitnessPercent = soilFitnessPercent;
        this.priceForecastPercent = priceForecastPercent;
        this.supplyStabilityPercent = supplyStabilityPercent;
        this.supplyStatus = supplyStatus;
        this.expectedRevenuePerKg = expectedRevenuePerKg;
        this.expectedYield = expectedYield;
        this.aiReason = aiReason;
        this.difficulty = difficulty;
        this.growthDays = growthDays;
        this.optimalTemp = optimalTemp;
        this.sowingPeriod = sowingPeriod;
        this.harvestPeriod = harvestPeriod;
    }

    public void setHistory(RecommendHistoryEntity history) {
        this.history = history;
    }
}
