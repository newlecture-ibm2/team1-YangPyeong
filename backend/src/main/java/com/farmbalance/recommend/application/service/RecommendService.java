package com.farmbalance.recommend.application.service;

import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.exception.FarmNotFoundException;
import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadCropCandidatePort;
import com.farmbalance.recommend.application.port.out.LoadSupplyStatusPort;
import com.farmbalance.recommend.domain.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

/**
 * AI 작물 추천 서비스
 *
 * 1. 농장 정보 조회 (farm 모듈)
 * 2. 후보 작물 로드 (crop 어댑터)
 * 3. 각 작물에 대해 4항목 가중 점수 산출
 * 4. 점수 기준 정렬 → 추천 결과 반환
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendService implements RecommendCropUseCase {

    private final LoadFarmPort loadFarmPort;
    private final LoadCropCandidatePort loadCropCandidatePort;
    private final LoadSupplyStatusPort loadSupplyStatusPort;

    /** 점수 산출 엔진 (도메인 순수 객체, DI 불필요) */
    private final RecommendScoreCalculator calculator = new RecommendScoreCalculator();

    @Override
    public RecommendResult recommend(Long farmId) {
        // 1. 농장 정보 조회
        Farm farm = loadFarmPort.loadFarmById(farmId)
                .orElseThrow(FarmNotFoundException::new);

        // 2. 후보 작물 조회 (지역 기반)
        String regionCode = farm.getBjdCode() != null ? farm.getBjdCode() : "";
        List<CropCandidateData> candidates = loadCropCandidatePort.loadCandidates(regionCode);

        // 3. 각 작물에 대해 점수 산출
        List<CropRecommendation> recommendations = new ArrayList<>();

        for (CropCandidateData candidate : candidates) {
            // 3-1. 토양 적합도
            int soilPercent = calculator.calculateSoilFitness(
                    farm.getPh(),
                    farm.getOrganicMatter(),
                    farm.getSoilType(),
                    candidate.getOptimalPhMin(),
                    candidate.getOptimalPhMax(),
                    candidate.getOptimalOrganicMatter(),
                    candidate.getPreferredSoilTypes()
            );

            // 3-2. 수급 상태 → 수급 안정성 퍼센트
            SupplyStatus supplyStatus = loadSupplyStatusPort
                    .loadSupplyStatus(candidate.getCropId(), regionCode);
            int supplyPercent = calculator.calculateSupplyStability(supplyStatus);

            // 3-3. 시세 전망
            int pricePercent = candidate.getPriceForecastPercent();

            // 3-4. 난이도
            int difficulty = candidate.getDifficulty() != null ? candidate.getDifficulty() : 3;

            // 3-5. 종합 점수 산출
            int score = calculator.calculate(soilPercent, pricePercent, supplyPercent, difficulty);

            // 3-6. 카테고리 매핑
            CropCategory category = mapCategory(candidate.getCategory());

            // 3-7. 추천 객체 생성
            CropRecommendation rec = CropRecommendation.builder()
                    .cropId(candidate.getCropId())
                    .cropName(candidate.getCropName())
                    .category(category)
                    .score(score)
                    .soilFitness(calculator.toSoilFitnessGrade(soilPercent))
                    .soilFitnessPercent(soilPercent)
                    .priceForecastPercent(pricePercent)
                    .supplyStabilityPercent(supplyPercent)
                    .supplyStatus(supplyStatus)
                    .expectedRevenuePerKg(candidate.getExpectedRevenuePerKg())
                    .expectedYield(candidate.getExpectedYield())
                    .growthDays(candidate.getGrowthDays())
                    .optimalTemp(candidate.getOptimalTemp())
                    .sowingPeriod(candidate.getSowingPeriod())
                    .harvestPeriod(candidate.getHarvestPeriod())
                    .difficulty(difficulty)
                    .pests(candidate.getPests() != null ? Arrays.asList(candidate.getPests()) : List.of())
                    .build();

            recommendations.add(rec);
        }

        // 4. 점수 기준 내림차순 정렬 + 순위 부여
        recommendations.sort(Comparator.comparingInt(CropRecommendation::getScore).reversed());
        for (int i = 0; i < recommendations.size(); i++) {
            recommendations.set(i, withRank(recommendations.get(i), i + 1));
        }

        // 5. 결과 조합
        return RecommendResult.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .farmAddress(farm.getAddress())
                .farmArea(farm.getArea())
                .soilPh(farm.getPh())
                .organicMatter(farm.getOrganicMatter())
                .soilType(farm.getSoilType())
                .recommendations(recommendations)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /** 카테고리 문자열 → enum 매핑 */
    private CropCategory mapCategory(String label) {
        if (label == null) return CropCategory.VEGETABLE;
        for (CropCategory cat : CropCategory.values()) {
            if (cat.getLabel().equals(label)) return cat;
        }
        return CropCategory.VEGETABLE;
    }

    /** 순위를 부여한 새 객체 생성 (toBuilder로 immutable 유지) */
    private CropRecommendation withRank(CropRecommendation rec, int rank) {
        return rec.toBuilder().rank(rank).build();
    }
}
