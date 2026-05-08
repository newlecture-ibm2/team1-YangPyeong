package com.farmbalance.recommend.application.service;

import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadCropCandidatePort;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.application.port.out.LoadSupplyStatusPort;
import com.farmbalance.recommend.application.port.out.LoadRecommendHistoryPort;
import com.farmbalance.recommend.application.port.out.SaveRecommendHistoryPort;
import com.farmbalance.recommend.application.port.in.GetRecommendHistoryUseCase;
import com.farmbalance.recommend.domain.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * 1. 농장 정보 조회 (JDBC 경량 포트)
 * 2. 후보 작물 로드 (실 DB 어댑터)
 * 3. 각 작물에 대해 4항목 가중 점수 산출
 * 4. 점수 기준 정렬 → 추천 결과 반환
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendService implements RecommendCropUseCase, GetRecommendHistoryUseCase {

    private final LoadFarmForRecommendPort loadFarmForRecommendPort;
    private final LoadCropCandidatePort loadCropCandidatePort;
    private final LoadSupplyStatusPort loadSupplyStatusPort;
    private final SaveRecommendHistoryPort saveRecommendHistoryPort;
    private final LoadRecommendHistoryPort loadRecommendHistoryPort;

    /** 점수 산출 엔진 (도메인 순수 객체, DI 불필요) */
    private final RecommendScoreCalculator calculator = new RecommendScoreCalculator();

    @Override
    @Transactional
    public RecommendResult recommend(Long userId, Long farmId) {
        // 0. 농장 소유자 검증
        validateFarmOwnership(userId, farmId);

        // 1. 농장 정보 조회 (JDBC 직접 조회)
        FarmBasicData farm = loadFarmForRecommendPort.loadFarmBasic(farmId)
                .orElseThrow(() -> new IllegalArgumentException("농장을 찾을 수 없습니다: " + farmId));

        // 2. 후보 작물 조회 (지역 기반)
        String regionCode = farm.getBjdCode() != null ? farm.getBjdCode() : "";
        List<CropCandidateData> candidates = loadCropCandidatePort.loadCandidates(regionCode);

        log.info("추천 시작: farmId={}, farmName={}, regionCode={}, 후보작물={}건",
                farmId, farm.getName(), regionCode, candidates.size());

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
            CropCategory category = CropCategory.fromLabel(candidate.getCategory());

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

        log.info("추천 완료: {}건 산출, 1위={} ({}점)",
                recommendations.size(),
                recommendations.isEmpty() ? "-" : recommendations.get(0).getCropName(),
                recommendations.isEmpty() ? 0 : recommendations.get(0).getScore());

        // 5. 결과 조합
        RecommendResult result = RecommendResult.builder()
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
                
        // 6. 추천 결과 이력 저장
        saveRecommendHistoryPort.save(result);
        
        return result;
    }
    
    @Override
    public List<RecommendResult> getHistory(Long userId, Long farmId) {
        validateFarmOwnership(userId, farmId);
        return loadRecommendHistoryPort.loadByFarmId(farmId);
    }

    @Override
    public RecommendResult getLatestHistory(Long userId, Long farmId) {
        validateFarmOwnership(userId, farmId);
        return loadRecommendHistoryPort.loadLatestByFarmId(farmId)
                .orElseThrow(() -> new IllegalArgumentException("추천 이력이 없습니다: " + farmId));
    }

    /** 농장 소유자 검증 */
    private void validateFarmOwnership(Long userId, Long farmId) {
        if (userId == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("인증 정보가 없습니다.");
        }
        if (!loadFarmForRecommendPort.isOwnedBy(farmId, userId)) {
            throw new org.springframework.security.access.AccessDeniedException("해당 농장에 대한 접근 권한이 없습니다: farmId=" + farmId);
        }
    }

    /** 순위를 부여한 새 객체 생성 (toBuilder로 immutable 유지) */
    private CropRecommendation withRank(CropRecommendation rec, int rank) {
        return rec.toBuilder().rank(rank).build();
    }
}
