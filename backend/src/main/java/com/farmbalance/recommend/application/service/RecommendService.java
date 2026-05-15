package com.farmbalance.recommend.application.service;

import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.out.*;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.application.port.in.GetRecommendHistoryUseCase;
import com.farmbalance.recommend.application.port.in.DiagnoseCropImageUseCase;
import com.farmbalance.recommend.adapter.out.persistence.CropCultivationEnvLookup;
import com.farmbalance.recommend.application.support.FarmRecommendDetailsBuilder;
import com.farmbalance.recommend.application.support.RecommendCropAnalysisHelper;
import com.farmbalance.recommend.application.support.RecommendCropAnalysisHelper.MismatchInfo;
import com.farmbalance.recommend.application.support.RecommendModeResolver;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationType;
import com.farmbalance.recommend.domain.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendService implements RecommendCropUseCase, GetRecommendHistoryUseCase, DiagnoseCropImageUseCase {

    private static final int MAX_NEW_RECOMMEND_AI = 5;
    private static final int MAX_LIST_SIZE = 30;

    private final LoadFarmForRecommendPort loadFarmForRecommendPort;
    private final LoadCropCandidatePort loadCropCandidatePort;
    private final LoadFarmCultivationContextPort loadFarmCultivationContextPort;
    private final SaveRecommendHistoryPort saveRecommendHistoryPort;
    private final LoadRecommendHistoryPort loadRecommendHistoryPort;
    private final RecommendAiPort recommendAiPort;
    private final RecommendPricePort recommendPricePort;
    private final NotificationUseCase notificationUseCase;
    private final CropCultivationEnvLookup cropCultivationEnvLookup;
    private final RecommendModeResolver recommendModeResolver;
    private final FarmRecommendDetailsBuilder farmRecommendDetailsBuilder;
    private final RecommendCropAnalysisHelper cropAnalysisHelper;

    @Override
    @Transactional
    public RecommendResult recommend(Long userId, Long farmId) {
        validateFarmOwnership(userId, farmId);

        FarmBasicData farm = loadFarmForRecommendPort.loadFarmBasic(farmId)
                .orElseThrow(() -> new IllegalArgumentException("농장을 찾을 수 없습니다: " + farmId));

        String regionCode = farm.getBjdCode() != null ? farm.getBjdCode() : "";
        List<CropCandidateData> candidates = loadCropCandidatePort.loadCandidates(regionCode);
        if (candidates.isEmpty()) {
            log.warn("지역 기반(region={}) 후보 작물 없음 -> 전국 단위로 폴백 조회", regionCode);
            candidates = loadCropCandidatePort.loadCandidates("");
        }

        FarmCultivationContext cultivationContext = loadFarmCultivationContextPort.loadByFarmId(farmId);
        RecommendMode mode = recommendModeResolver.resolve(cultivationContext);

        double[] tunedWeights = recommendAiPort.tuneWeights(
                farmRecommendDetailsBuilder.build(farm, cultivationContext, mode, null));
        RecommendScoreCalculator calculator = new RecommendScoreCalculator(
                tunedWeights[0], tunedWeights[1], tunedWeights[2], tunedWeights[3]);

        String soilMismatchSummary = cropAnalysisHelper.buildGlobalMismatchSummary(
                cultivationContext, candidates, farm, calculator);
        String farmDetails = farmRecommendDetailsBuilder.build(
                farm, cultivationContext, mode, soilMismatchSummary);

        Set<Long> registeredCropIds = cultivationContext.getItems().stream()
                .map(CultivationContextItem::getCropId)
                .collect(Collectors.toSet());

        List<CropRecommendation> currentCropAdvices = buildCurrentCropAdvices(
                cultivationContext, candidates, farm, regionCode, calculator, mode, farmDetails);

        AdviceType defaultNewType = mode == RecommendMode.MANAGE || mode == RecommendMode.MIXED
                ? AdviceType.NEXT_SEASON
                : AdviceType.NEW_RECOMMEND;

        List<CropRecommendation> recommendations = candidates.stream()
                .filter(c -> !registeredCropIds.contains(c.getCropId()))
                .map(c -> cropAnalysisHelper.buildFromCandidate(
                        c, farm, regionCode, calculator, defaultNewType))
                .sorted(Comparator.comparingInt(CropRecommendation::getScore).reversed())
                .limit(MAX_LIST_SIZE)
                .collect(Collectors.toCollection(ArrayList::new));

        assignRanks(recommendations, 1);
        assignRanks(currentCropAdvices, 1);

        applyAiReasons(farmDetails, mode, currentCropAdvices, recommendations);

        recommendations = enrichMissingPests(recommendations);
        currentCropAdvices = enrichMissingPests(currentCropAdvices);

        log.info("추천 완료: farmId={}, mode={}, 코칭={}건, 신규/참고={}건",
                farmId, mode, currentCropAdvices.size(), recommendations.size());

        RecommendResult result = RecommendResult.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .farmAddress(farm.getAddress())
                .farmArea(farm.getArea())
                .soilPh(farm.getPh())
                .organicMatter(farm.getOrganicMatter())
                .soilType(farm.getSoilType())
                .recommendMode(mode)
                .currentCropAdvices(currentCropAdvices)
                .recommendations(recommendations)
                .generatedAt(LocalDateTime.now())
                .build();

        saveRecommendHistoryPort.save(result);

        notificationUseCase.createNotification(
                userId,
                NotificationType.SYSTEM,
                "AI 추천 완료",
                String.format("'%s' 농장의 작물 추천이 완료되었습니다.", farm.getName()),
                "/farm/recommend");

        return result;
    }

    private List<CropRecommendation> buildCurrentCropAdvices(
            FarmCultivationContext ctx,
            List<CropCandidateData> candidates,
            FarmBasicData farm,
            String regionCode,
            RecommendScoreCalculator calculator,
            RecommendMode mode,
            String farmDetails
    ) {
        if (!ctx.hasRegistrations()) {
            return List.of();
        }

        List<CropRecommendation> advices = new ArrayList<>();
        for (CultivationContextItem item : ctx.getItems()) {
            Optional<CropCandidateData> candidateOpt = cropAnalysisHelper.findCandidate(candidates, item.getCropId());
            if (candidateOpt.isEmpty()) {
                log.warn("재배 등록 작물 후보 없음: cropId={}, name={}", item.getCropId(), item.getCropName());
                continue;
            }
            CropCandidateData candidate = candidateOpt.get();
            AdviceType adviceType = item.isInSeason()
                    ? AdviceType.IN_SEASON_COACHING
                    : AdviceType.PLANNED_CROP;

            MismatchInfo mismatch = cropAnalysisHelper.computeMismatch(
                    item, candidate, candidates, farm, calculator);

            CropRecommendation rec = cropAnalysisHelper.buildFromCandidate(
                    candidate, farm, regionCode, calculator, adviceType);
            rec = rec.toBuilder()
                    .mismatchNote(mismatch.note())
                    .build();
            advices.add(rec);
        }
        advices.sort(Comparator.comparingInt(CropRecommendation::getScore).reversed());
        return advices;
    }

    private void applyAiReasons(
            String farmDetails,
            RecommendMode mode,
            List<CropRecommendation> currentCropAdvices,
            List<CropRecommendation> recommendations
    ) {
        List<java.util.concurrent.CompletableFuture<CropRecommendation>> futures = new ArrayList<>();

        for (CropRecommendation rec : currentCropAdvices) {
            futures.add(java.util.concurrent.CompletableFuture.supplyAsync(() ->
                    attachAiReason(farmDetails, mode, rec, true)));
        }

        int aiLimit = Math.min(MAX_NEW_RECOMMEND_AI, recommendations.size());
        for (int i = 0; i < aiLimit; i++) {
            final CropRecommendation rec = recommendations.get(i);
            futures.add(java.util.concurrent.CompletableFuture.supplyAsync(() ->
                    attachAiReason(farmDetails, mode, rec, false)));
        }

        List<CropRecommendation> updatedCurrent = new ArrayList<>();
        List<CropRecommendation> updatedNew = new ArrayList<>(recommendations);

        int idx = 0;
        for (int i = 0; i < currentCropAdvices.size(); i++) {
            try {
                updatedCurrent.add(futures.get(idx++).get(12, java.util.concurrent.TimeUnit.SECONDS));
            } catch (Exception e) {
                log.warn("코칭 AI 사유 실패: {}", e.getMessage());
                updatedCurrent.add(currentCropAdvices.get(i));
            }
        }
        for (int i = 0; i < aiLimit; i++) {
            try {
                updatedNew.set(i, futures.get(idx++).get(12, java.util.concurrent.TimeUnit.SECONDS));
            } catch (Exception e) {
                log.warn("추천 AI 사유 실패: {}", e.getMessage());
            }
        }

        currentCropAdvices.clear();
        currentCropAdvices.addAll(updatedCurrent);
        recommendations.clear();
        recommendations.addAll(updatedNew);
    }

    private CropRecommendation attachAiReason(
            String farmDetails,
            RecommendMode mode,
            CropRecommendation rec,
            boolean currentCrop
    ) {
        try {
            String reason = recommendAiPort.generateReason(new RecommendReasonCommand(
                    farmDetails,
                    rec.getCropName(),
                    rec.getCategory() != null ? rec.getCategory().getLabel() : "",
                    mode,
                    rec.getAdviceType() != null ? rec.getAdviceType() : AdviceType.NEW_RECOMMEND,
                    currentCrop,
                    rec.getMismatchNote()
            ));
            return rec.toBuilder().aiReason(reason).build();
        } catch (Exception e) {
            log.warn("AI 사유 생성 실패 (crop={}): {}", rec.getCropName(), e.getMessage());
            return rec.toBuilder()
                    .aiReason("현재 농장 데이터를 바탕으로 분석한 결과입니다.")
                    .build();
        }
    }

    private void assignRanks(List<CropRecommendation> list, int startRank) {
        for (int i = 0; i < list.size(); i++) {
            CropRecommendation rec = list.get(i);
            list.set(i, rec.toBuilder().rank(startRank + i).build());
        }
    }

    @Override
    public List<RecommendResult> getHistory(Long userId, Long farmId) {
        validateFarmOwnership(userId, farmId);
        return loadRecommendHistoryPort.loadByFarmId(farmId).stream()
                .map(this::enrichResultPests)
                .toList();
    }

    @Override
    public RecommendResult getLatestHistory(Long userId, Long farmId) {
        validateFarmOwnership(userId, farmId);
        return loadRecommendHistoryPort.loadLatestByFarmId(farmId)
                .map(this::enrichResultPests)
                .orElse(null);
    }

    @Override
    public String diagnose(Long userId, MultipartFile image) {
        if (userId == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException(
                    "인증 정보가 없습니다.");
        }
        return recommendAiPort.diagnoseImage(image);
    }

    private void validateFarmOwnership(Long userId, Long farmId) {
        if (userId == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException(
                    "인증 정보가 없습니다.");
        }
        if (!loadFarmForRecommendPort.isOwnedBy(farmId, userId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "해당 농장에 대한 접근 권한이 없습니다: farmId=" + farmId);
        }
    }

    private RecommendResult enrichResultPests(RecommendResult result) {
        if (result == null) {
            return null;
        }
        return result.toBuilder()
                .recommendations(enrichMissingPests(
                        result.getRecommendations() != null ? result.getRecommendations() : List.of()))
                .currentCropAdvices(enrichMissingPests(
                        result.getCurrentCropAdvices() != null ? result.getCurrentCropAdvices() : List.of()))
                .build();
    }

    private List<CropRecommendation> enrichMissingPests(List<CropRecommendation> recommendations) {
        Map<String, List<String>> pestsByCropName = new HashMap<>();
        List<CropRecommendation> enriched = new ArrayList<>(recommendations.size());
        for (CropRecommendation rec : recommendations) {
            if (rec.getPests() != null && !rec.getPests().isEmpty()) {
                enriched.add(rec);
                continue;
            }
            List<String> pests = pestsByCropName.computeIfAbsent(
                    rec.getCropName(),
                    cropCultivationEnvLookup::findMajorPests
            );
            enriched.add(pests.isEmpty() ? rec : rec.toBuilder().pests(pests).build());
        }
        return enriched;
    }
}
