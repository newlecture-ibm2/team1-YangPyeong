package com.farmbalance.recommend.application.service;

import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadCropCandidatePort;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.application.port.out.LoadSupplyStatusPort;
import com.farmbalance.recommend.application.port.out.LoadRecommendHistoryPort;
import com.farmbalance.recommend.application.port.out.SaveRecommendHistoryPort;
import com.farmbalance.recommend.application.port.out.RecommendAiPort;
import com.farmbalance.recommend.application.port.out.RecommendPricePort;
import com.farmbalance.recommend.application.port.in.GetRecommendHistoryUseCase;
import com.farmbalance.recommend.application.port.in.DiagnoseCropImageUseCase;
import com.farmbalance.recommend.domain.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
public class RecommendService implements RecommendCropUseCase, GetRecommendHistoryUseCase, DiagnoseCropImageUseCase {

    private final LoadFarmForRecommendPort loadFarmForRecommendPort;
    private final LoadCropCandidatePort loadCropCandidatePort;
    private final LoadSupplyStatusPort loadSupplyStatusPort;
    private final SaveRecommendHistoryPort saveRecommendHistoryPort;
    private final LoadRecommendHistoryPort loadRecommendHistoryPort;
    private final com.farmbalance.recommend.application.port.out.RecommendAiPort recommendAiPort;
    private final RecommendPricePort recommendPricePort;



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

        // [방어 로직] 해당 지역 데이터가 없으면 전국 단위로 폴백하여 추천 리스트가 비지 않게 함
        if (candidates.isEmpty()) {
            log.warn("지역 기반(region={}) 후보 작물 없음 -> 전국 단위로 폴백 조회", regionCode);
            candidates = loadCropCandidatePort.loadCandidates("");
        }

        log.info("추천 시작: farmId={}, farmName={}, regionCode={}, 후보작물={}건",
                farmId, farm.getName(), regionCode, candidates.size());

        // 3. AI 가중치 튜닝 (농장 상황 기반)
        String farmDetails = String.format("위치: %s, 면적: %.1f평, 토양pH: %.1f, 유기물: %.1f, 토성: %s",
                farm.getAddress(), farm.getArea() / 3.3058, farm.getPh(), farm.getOrganicMatter(), farm.getSoilType());
        
        double[] tunedWeights = recommendAiPort.tuneWeights(farmDetails);
        RecommendScoreCalculator calculator = new RecommendScoreCalculator(
                tunedWeights[0], tunedWeights[1], tunedWeights[2], tunedWeights[3]
        );

        // 4. 각 작물에 대해 점수 산출
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
            int supplyPercent = supplyStatus != null ? supplyStatus.getStabilityScore() : 50;

            // 3-3. 시세 전망 및 예상 수익금액 (KAMIS 연동)
            int pricePercent = candidate.getPriceForecastPercent();
            
            Integer kamisPrice = recommendPricePort.getRecentPricePerKg(candidate.getCropName());
            Integer expectedRevenue = kamisPrice != null ? kamisPrice : candidate.getExpectedRevenuePerKg();

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
                    .build();

            recommendations.add(rec);
        }

        // 5. 점수 기준 내림차순 정렬 + 순위 부여
        recommendations.sort(Comparator.comparingInt(CropRecommendation::getScore).reversed());
        
        // 6. 상위 5개 항목에 대해 실시간 AI 분석 사유 생성 (병렬 처리)
        // 병렬 스트림을 사용하여 LLM 호출 시간을 단축합니다.
        List<java.util.concurrent.CompletableFuture<CropRecommendation>> futures = new ArrayList<>();
        
        final String finalFarmDetails = farmDetails;
        for (int i = 0; i < recommendations.size(); i++) {
            final int rank = i + 1;
            final CropRecommendation rec = recommendations.get(i);
            
            if (i < 5) {
                futures.add(java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                    String aiReason;
                    try {
                        aiReason = recommendAiPort.generateReason(finalFarmDetails, rec.getCropName(), rec.getCategory().getLabel());
                    } catch (Exception e) {
                        log.warn("AI 사유 생성 실패 (crop={}): {}", rec.getCropName(), e.getMessage());
                        aiReason = "현재 데이터 기반 최적의 작물로 분석되었습니다.";
                    }
                    return rec.toBuilder().rank(rank).aiReason(aiReason).build();
                }));
            } else {
                recommendations.set(i, rec.toBuilder().rank(rank).build());
            }
        }

        // 결과 대기 및 반영
        for (int i = 0; i < futures.size(); i++) {
            try {
                recommendations.set(i, futures.get(i).get(10, java.util.concurrent.TimeUnit.SECONDS));
            } catch (Exception e) {
                log.error("AI 사유 결과 대기 중 오류: {}", e.getMessage());
            }
        }

        log.info("추천 완료: {}건 산출, 1위={} ({}점)",
                recommendations.size(),
                recommendations.isEmpty() ? "-" : recommendations.get(0).getCropName(),
                recommendations.isEmpty() ? 0 : recommendations.get(0).getScore());

        // 6. 결과 조합
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
                
        // 7. 추천 결과 이력 저장
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

    @Override
    public String diagnose(Long userId, MultipartFile image) {
        if (userId == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("인증 정보가 없습니다.");
        }
        return recommendAiPort.diagnoseImage(image);
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
