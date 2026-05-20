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
    private static final String GENERIC_AI_REASON_FALLBACK = "현재 농장 데이터를 바탕으로 분석한 결과입니다.";
    private static final String FAILED_AI_REASON_SNIPPET = "AI 분석 중 오류가 발생했습니다";
    private static final int MIN_AI_REASON_LEN = 12;

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

    /**
     * AI 사유를 배치로 일괄 생성하여 각 추천 항목에 적용합니다.
     *
     * <p>기존: 작물 N개 × 개별 CompletableFuture → N번의 LLM 네트워크 호출
     * <p>개선: 코칭 그룹 + 신규 그룹 → 최대 2번의 배치 LLM 호출
     */
    private void applyAiReasons(
            String farmDetails,
            RecommendMode mode,
            List<CropRecommendation> currentCropAdvices,
            List<CropRecommendation> recommendations
    ) {
        // 1. 코칭 작물 배치 사유 생성
        if (!currentCropAdvices.isEmpty()) {
            List<RecommendReasonCommand> coachingCommands = currentCropAdvices.stream()
                    .map(rec -> {
                        AdviceType advice = rec.getAdviceType() != null
                                ? rec.getAdviceType()
                                : AdviceType.IN_SEASON_COACHING;
                        boolean inSeasonCrop = advice == AdviceType.IN_SEASON_COACHING;
                        return new RecommendReasonCommand(
                                farmDetails,
                                rec.getCropName(),
                                rec.getCategory() != null ? rec.getCategory().getLabel() : "",
                                mode,
                                advice,
                                inSeasonCrop,
                                rec.getMismatchNote()
                        );
                    })
                    .toList();

            Map<String, String> coachingReasons = recommendAiPort.generateBatchReasons(
                    farmDetails, mode, coachingCommands);

            List<CropRecommendation> updatedCurrent = new ArrayList<>();
            for (int i = 0; i < currentCropAdvices.size(); i++) {
                CropRecommendation rec = currentCropAdvices.get(i);
                String reason = sanitizeStoredAiReason(
                        resolveAiReason(coachingReasons, rec, coachingCommands.get(i)));
                updatedCurrent.add(rec.toBuilder().aiReason(reason).build());
            }
            currentCropAdvices.clear();
            currentCropAdvices.addAll(updatedCurrent);
        }

        // 2. 신규/참고 작물 배치 사유 생성 (상위 N개만)
        int aiLimit = Math.min(MAX_NEW_RECOMMEND_AI, recommendations.size());
        if (aiLimit > 0) {
            List<CropRecommendation> targetRecs = recommendations.subList(0, aiLimit);
            List<RecommendReasonCommand> newCommands = targetRecs.stream()
                    .map(rec -> new RecommendReasonCommand(
                            farmDetails,
                            rec.getCropName(),
                            rec.getCategory() != null ? rec.getCategory().getLabel() : "",
                            mode,
                            rec.getAdviceType() != null ? rec.getAdviceType() : AdviceType.NEW_RECOMMEND,
                            false,
                            rec.getMismatchNote()
                    ))
                    .toList();

            Map<String, String> newReasons = recommendAiPort.generateBatchReasons(
                    farmDetails, mode, newCommands);

            for (int i = 0; i < aiLimit; i++) {
                CropRecommendation rec = recommendations.get(i);
                String reason = sanitizeStoredAiReason(
                        resolveAiReason(newReasons, rec, newCommands.get(i)));
                recommendations.set(i, rec.toBuilder().aiReason(reason).build());
            }
        }
    }

    private boolean isWeakAiReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return true;
        }
        String trimmed = reason.trim();
        if (trimmed.length() < MIN_AI_REASON_LEN) {
            return true;
        }
        if (GENERIC_AI_REASON_FALLBACK.equals(trimmed)) {
            return true;
        }
        return trimmed.contains(FAILED_AI_REASON_SNIPPET);
    }

    /**
     * 배치 결과가 비었거나 플레이스홀더면 작물별 단건 LLM 호출로 보완합니다.
     */
    private String findBatchReason(Map<String, String> batchReasons, String cropName) {
        if (cropName == null || batchReasons == null || batchReasons.isEmpty()) {
            return null;
        }
        String direct = batchReasons.get(cropName);
        if (direct != null) {
            return direct;
        }
        String norm = cropName.replaceAll("\\s+", "");
        for (Map.Entry<String, String> entry : batchReasons.entrySet()) {
            if (entry.getKey() != null
                    && entry.getKey().replaceAll("\\s+", "").equals(norm)
                    && entry.getValue() != null) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String resolveAiReason(
            Map<String, String> batchReasons,
            CropRecommendation rec,
            RecommendReasonCommand command
    ) {
        String fromBatch = findBatchReason(batchReasons, rec.getCropName());
        if (!isWeakAiReason(fromBatch)) {
            return fromBatch.trim();
        }
        try {
            String individual = recommendAiPort.generateReason(command);
            if (!isWeakAiReason(individual)) {
                log.info("배치 사유 미매칭 → 개별 사유 사용: {}", rec.getCropName());
                return individual.trim();
            }
        } catch (Exception e) {
            log.warn("개별 AI 사유 생성 실패 crop={}: {}", rec.getCropName(), e.getMessage());
        }
        if (!isWeakAiReason(fromBatch)) {
            return fromBatch.trim();
        }
        log.warn("AI 추천 사유 미생성(플레이스홀더 저장 안 함): crop={}", rec.getCropName());
        return null;
    }

    private String sanitizeStoredAiReason(String reason) {
        if (isWeakAiReason(reason)) {
            return null;
        }
        return reason != null ? reason.trim() : null;
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

