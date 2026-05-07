package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.CropCandidateData;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * CropCandidateData 인터페이스의 기본 구현체
 * JdbcCropCandidateAdapter에서 DB 조회 결과를 매핑할 때 사용합니다.
 */
@Getter
@AllArgsConstructor
public class DefaultCropCandidateData implements CropCandidateData {

    private final Long cropId;
    private final String cropName;
    private final String category;
    private final double optimalPhMin;
    private final double optimalPhMax;
    private final double optimalOrganicMatter;
    private final String[] preferredSoilTypes;
    private final int priceForecastPercent;
    private final int expectedRevenuePerKg;
    private final Integer expectedYield;
    private final Integer growthDays;
    private final String optimalTemp;
    private final String sowingPeriod;
    private final String harvestPeriod;
    private final Integer difficulty;
    private final String[] pests;
}
