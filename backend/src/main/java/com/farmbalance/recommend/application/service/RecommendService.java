package com.farmbalance.recommend.application.service;

import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.out.*;
import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.application.port.in.GetRecommendHistoryUseCase;
import com.farmbalance.recommend.application.port.in.DiagnoseCropImageUseCase;
import com.farmbalance.recommend.adapter.out.persistence.CropCultivationEnvLookup;
import com.farmbalance.recommend.application.support.AiCoachingEligibility;
import com.farmbalance.recommend.application.support.FarmRecommendDetailsBuilder;
import com.farmbalance.recommend.application.support.RecommendCropAnalysisHelper;
import com.farmbalance.recommend.application.support.RecommendCropAnalysisHelper.MismatchInfo;
import com.farmbalance.recommend.application.support.RecommendModeResolver;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import com.farmbalance.recommend.domain.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendService implements RecommendCropUseCase, GetRecommendHistoryUseCase, DiagnoseCropImageUseCase {

    private static final int MAX_COACHING_REQUEST_PER_CALL = 5;
    private static final int MAX_LIST_SIZE = 30;
    /** true 시 배치 실패 작물에 대한 개별 LLM 호출 비활성 (504·지연 방지) */
    private static final boolean ALLOW_INDIVIDUAL_AI_REASON_FALLBACK = false;
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

    @Qualifier("recommendAiExecutor")
    private final Executor recommendAiExecutor;

    @Override
    @Transactional
    public RecommendResult recommend(Long userId, Long farmId) {
        RecommendBuild build = buildScoredRecommendations(userId, farmId);
        preserveAiReasonsFromLatestHistory(build, farmId);

        List<CropRecommendation> coaching = attachCoachingMetadata(
                build.currentCropAdvices(), build.cultivationByCropId(), true);
        List<CropRecommendation> recommendations = attachCoachingMetadata(
                build.recommendations(), build.cultivationByCropId(), false);

        log.info("빠른 추천 완료(LLM 생략): farmId={}, mode={}, 코칭={}건, 신규/참고={}건",
                farmId, build.mode(), coaching.size(), recommendations.size());

        return saveAndNotify(userId, build, coaching, recommendations,
                "AI 추천 분석 완료",
                String.format("'%s' 농장의 작물 적합도 분석이 완료되었습니다.", build.farm().getName()));
    }

    @Override
    @Transactional
    public RecommendResult requestAiCoaching(Long userId, Long farmId, List<Long> cropIds) {
        if (cropIds == null || cropIds.isEmpty()) {
            throw new IllegalArgumentException("AI 코칭을 요청할 작물을 선택해 주세요.");
        }
        if (cropIds.size() > MAX_COACHING_REQUEST_PER_CALL) {
            throw new IllegalArgumentException(
                    "한 번에 최대 " + MAX_COACHING_REQUEST_PER_CALL + "개 작물까지 AI 코칭을 요청할 수 있습니다.");
        }

        RecommendBuild build = buildScoredRecommendations(userId, farmId);
        preserveAiReasonsFromLatestHistory(build, farmId);
        overlayPreviousMetricsFromLatestHistory(build, farmId);

        Set<Long> targetIds = new LinkedHashSet<>(cropIds);
        validateCoachingTargets(targetIds, build);

        List<CropRecommendation> coaching = new ArrayList<>(build.currentCropAdvices());
        List<CropRecommendation> recommendations = new ArrayList<>(build.recommendations());

        applyAiReasonsForCropIds(
                build.farmDetails(), build.mode(), coaching, recommendations, targetIds);

        coaching = attachCoachingMetadata(coaching, build.cultivationByCropId(), true);
        recommendations = attachCoachingMetadata(recommendations, build.cultivationByCropId(), false);
        coaching = enrichMissingPests(coaching);
        recommendations = enrichMissingPests(recommendations);

        log.info("AI 코칭 완료: farmId={}, 요청 작물={}", farmId, targetIds);

        return saveAndNotify(userId, build, coaching, recommendations,
                "AI 코칭 완료",
                String.format("'%s' 농장의 AI 맞춤 코칭이 준비되었습니다.", build.farm().getName()));
    }

    private record RecommendBuild(
            FarmBasicData farm,
            RecommendMode mode,
            String farmDetails,
            FarmCultivationContext cultivationContext,
            Map<Long, CultivationContextItem> cultivationByCropId,
            List<CropRecommendation> currentCropAdvices,
            List<CropRecommendation> recommendations
    ) {}

    private RecommendBuild buildScoredRecommendations(Long userId, Long farmId) {
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
        RecommendScoreCalculator calculator = new RecommendScoreCalculator();

        String soilMismatchSummary = cropAnalysisHelper.buildGlobalMismatchSummary(
                cultivationContext, candidates, farm, calculator);
        String farmDetails = farmRecommendDetailsBuilder.build(
                farm, cultivationContext, mode, soilMismatchSummary);

        Map<Long, CultivationContextItem> cultivationByCropId = cultivationContext.getItems().stream()
                .collect(Collectors.toMap(
                        CultivationContextItem::getCropId,
                        item -> item,
                        (a, b) -> a,
                        LinkedHashMap::new));

        Set<Long> registeredCropIds = cultivationContext.getItems().stream()
                .map(CultivationContextItem::getCropId)
                .collect(Collectors.toSet());

        List<CropRecommendation> currentCropAdvices = buildCurrentCropAdvices(
                cultivationContext, candidates, farm, regionCode, calculator);

        AdviceType defaultNewType = mode == RecommendMode.MANAGE || mode == RecommendMode.MIXED
                ? AdviceType.NEXT_SEASON
                : AdviceType.NEW_RECOMMEND;

        List<CropCandidateData> topCandidates = candidates.stream()
                .filter(c -> !registeredCropIds.contains(c.getCropId()))
                .sorted(Comparator.comparingInt((CropCandidateData c) ->
                        cropAnalysisHelper.estimateQuickScore(c, farm, calculator)).reversed())
                .limit(MAX_LIST_SIZE)
                .toList();

        List<CropRecommendation> recommendations = topCandidates.stream()
                .map(c -> cropAnalysisHelper.buildFromCandidate(
                        c, farm, regionCode, calculator, defaultNewType))
                .sorted(Comparator.comparingInt(CropRecommendation::getScore).reversed())
                .collect(Collectors.toCollection(ArrayList::new));

        assignRanks(recommendations, 1);
        assignRanks(currentCropAdvices, 1);

        recommendations = enrichMissingPests(recommendations);
        currentCropAdvices = enrichMissingPests(currentCropAdvices);

        return new RecommendBuild(
                farm, mode, farmDetails, cultivationContext,
                cultivationByCropId, currentCropAdvices, recommendations);
    }

    private RecommendResult saveAndNotify(
            Long userId,
            RecommendBuild build,
            List<CropRecommendation> coaching,
            List<CropRecommendation> recommendations,
            String notificationTitle,
            String notificationBody
    ) {
        coaching = dedupeCoachingList(coaching);
        recommendations = dedupeRecommendationList(recommendations);

        RecommendResult result = RecommendResult.builder()
                .farmId(build.farm().getId())
                .farmName(build.farm().getName())
                .farmAddress(build.farm().getAddress())
                .farmArea(build.farm().getArea())
                .soilPh(build.farm().getPh())
                .organicMatter(build.farm().getOrganicMatter())
                .soilType(build.farm().getSoilType())
                .recommendMode(build.mode())
                .currentCropAdvices(coaching)
                .recommendations(recommendations)
                .generatedAt(LocalDateTime.now())
                .build();

        saveRecommendHistoryPort.save(result);

        notificationUseCase.createNotification(
                userId,
                NotificationType.SYSTEM,
                NotificationCategory.SYSTEM,
                notificationTitle,
                notificationBody,
                "/farm/recommend");

        return result;
    }

    private void preserveAiReasonsFromLatestHistory(RecommendBuild build, Long farmId) {
        loadRecommendHistoryPort.loadLatestByFarmId(farmId).ifPresent(prev -> {
            Map<String, String> reasons = new HashMap<>();
            appendReasons(reasons, prev.getCurrentCropAdvices());
            appendReasons(reasons, prev.getRecommendations());
            if (reasons.isEmpty()) {
                return;
            }
            mergeReasons(build.currentCropAdvices(), reasons);
            mergeReasons(build.recommendations(), reasons);
        });
    }

    /** AI 코칭 요청 시 점수·순위 급변 방지 — 직전 이력의 지표 유지 */
    private void overlayPreviousMetricsFromLatestHistory(RecommendBuild build, Long farmId) {
        loadRecommendHistoryPort.loadLatestByFarmId(farmId).ifPresent(prev -> {
            overlayListMetrics(build.currentCropAdvices(), prev.getCurrentCropAdvices());
            overlayListMetrics(build.recommendations(), prev.getRecommendations());
        });
    }

    private static String recommendationKey(CropRecommendation rec) {
        if (rec.getRegistrationId() != null) {
            return "reg-" + rec.getRegistrationId();
        }
        return "crop-" + rec.getCropId() + "-"
                + (rec.getAdviceType() != null ? rec.getAdviceType().name() : "na");
    }

    private static void overlayListMetrics(
            List<CropRecommendation> current,
            List<CropRecommendation> previous
    ) {
        if (previous == null || previous.isEmpty() || current == null) {
            return;
        }
        Map<String, CropRecommendation> prevByKey = new HashMap<>();
        for (CropRecommendation prev : previous) {
            prevByKey.put(recommendationKey(prev), prev);
            prevByKey.putIfAbsent("crop-" + prev.getCropId(), prev);
        }
        for (int i = 0; i < current.size(); i++) {
            CropRecommendation rec = current.get(i);
            CropRecommendation prev = prevByKey.get(recommendationKey(rec));
            if (prev == null) {
                prev = prevByKey.get("crop-" + rec.getCropId());
            }
            if (prev == null) {
                continue;
            }
            current.set(i, rec.toBuilder()
                    .score(prev.getScore())
                    .rank(prev.getRank())
                    .soilFitness(prev.getSoilFitness())
                    .soilFitnessPercent(prev.getSoilFitnessPercent())
                    .priceForecastPercent(prev.getPriceForecastPercent())
                    .supplyStabilityPercent(prev.getSupplyStabilityPercent())
                    .supplyStatus(prev.getSupplyStatus())
                    .build());
        }
    }

    private static void appendReasons(Map<String, String> reasons, List<CropRecommendation> list) {
        if (list == null) {
            return;
        }
        for (CropRecommendation rec : list) {
            if (rec.getAiReason() != null && !rec.getAiReason().isBlank()) {
                reasons.putIfAbsent(recommendationKey(rec), rec.getAiReason());
            }
        }
    }

    private static void mergeReasons(List<CropRecommendation> list, Map<String, String> reasons) {
        for (int i = 0; i < list.size(); i++) {
            CropRecommendation rec = list.get(i);
            String preserved = reasons.get(recommendationKey(rec));
            if (preserved == null) {
                preserved = reasons.get("crop-" + rec.getCropId());
            }
            if (preserved != null && (rec.getAiReason() == null || rec.getAiReason().isBlank())) {
                list.set(i, rec.toBuilder().aiReason(preserved).build());
            }
        }
    }

    private void validateCoachingTargets(Set<Long> cropIds, RecommendBuild build) {
        for (Long cropId : cropIds) {
            CropRecommendation rec = findRecommendationByCropId(
                    build.currentCropAdvices(), build.recommendations(), cropId);
            if (rec == null) {
                throw new IllegalArgumentException("추천 목록에 없는 작물입니다: cropId=" + cropId);
            }
            CultivationContextItem item = build.cultivationByCropId().get(cropId);
            AiCoachingEligibility.Result elig = item != null
                    ? AiCoachingEligibility.evaluate(item, rec)
                    : AiCoachingEligibility.evaluateNewRecommendation(rec, rec.getRank());

            if (elig.status() == AiCoachingEligibility.Status.HAS_AI) {
                continue;
            }
            if (item != null && AiCoachingEligibility.isCompletedRegistration(item)) {
                if (!AiCoachingEligibility.canRequestAiForCompleted(item)) {
                    throw new IllegalArgumentException(
                            rec.getCropName() + ": 수확량을 입력한 뒤 AI 복기 코칭을 요청해 주세요.");
                }
                continue;
            }
            if (!AiCoachingEligibility.canRequestAi(elig)) {
                throw new IllegalArgumentException(
                        rec.getCropName() + ": " + (elig.hint() != null ? elig.hint() : "AI 코칭 요청 조건을 충족하지 않습니다."));
            }
        }
    }

    private static CropRecommendation findRecommendationByCropId(
            List<CropRecommendation> coaching,
            List<CropRecommendation> recommendations,
            Long cropId
    ) {
        for (CropRecommendation rec : coaching) {
            if (rec.getCropId().equals(cropId)) {
                return rec;
            }
        }
        for (CropRecommendation rec : recommendations) {
            if (rec.getCropId().equals(cropId)) {
                return rec;
            }
        }
        return null;
    }

    private List<CropRecommendation> attachCoachingMetadata(
            List<CropRecommendation> recs,
            Map<Long, CultivationContextItem> byCropId,
            boolean coachingList
    ) {
        List<CropRecommendation> out = new ArrayList<>(recs.size());
        for (CropRecommendation rec : recs) {
            CultivationContextItem item = byCropId.get(rec.getCropId());
            AiCoachingEligibility.Result elig = coachingList
                    ? AiCoachingEligibility.evaluate(item, rec)
                    : AiCoachingEligibility.evaluateNewRecommendation(rec, rec.getRank());
            out.add(rec.toBuilder()
                    .registrationId(item != null ? item.getRegistrationId() : null)
                    .aiCoachingStatus(elig.status().name())
                    .aiCoachingHint(elig.hint())
                    .build());
        }
        return out;
    }

    private List<CropRecommendation> buildCurrentCropAdvices(
            FarmCultivationContext ctx,
            List<CropCandidateData> candidates,
            FarmBasicData farm,
            String regionCode,
            RecommendScoreCalculator calculator
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
                    .registrationId(item.getRegistrationId())
                    .mismatchNote(mismatch.note())
                    .build();
            advices.add(rec);
        }
        advices.sort(Comparator.comparingInt(CropRecommendation::getScore).reversed());
        return advices;
    }

    /**
     * 선택된 작물에만 AI 사유를 배치 생성합니다 (코칭·신규 배치 병렬).
     */
    private void applyAiReasonsForCropIds(
            String farmDetails,
            RecommendMode mode,
            List<CropRecommendation> currentCropAdvices,
            List<CropRecommendation> recommendations,
            Set<Long> targetCropIds
    ) {
        List<IndexedCommand> coachingCommands = new ArrayList<>();
        for (int i = 0; i < currentCropAdvices.size(); i++) {
            CropRecommendation rec = currentCropAdvices.get(i);
            if (!targetCropIds.contains(rec.getCropId())) {
                continue;
            }
            AdviceType advice = rec.getAdviceType() != null
                    ? rec.getAdviceType()
                    : AdviceType.IN_SEASON_COACHING;
            coachingCommands.add(new IndexedCommand(
                    i,
                    new RecommendReasonCommand(
                            farmDetails,
                            rec.getCropName(),
                            rec.getCategory() != null ? rec.getCategory().getLabel() : "",
                            mode,
                            advice,
                            advice == AdviceType.IN_SEASON_COACHING,
                            rec.getMismatchNote()
                    )
            ));
        }

        List<IndexedCommand> newCommands = new ArrayList<>();
        for (int i = 0; i < recommendations.size(); i++) {
            CropRecommendation rec = recommendations.get(i);
            if (!targetCropIds.contains(rec.getCropId())) {
                continue;
            }
            newCommands.add(new IndexedCommand(
                    i,
                    new RecommendReasonCommand(
                            farmDetails,
                            rec.getCropName(),
                            rec.getCategory() != null ? rec.getCategory().getLabel() : "",
                            mode,
                            rec.getAdviceType() != null ? rec.getAdviceType() : AdviceType.NEW_RECOMMEND,
                            false,
                            rec.getMismatchNote()
                    )
            ));
        }

        CompletableFuture<Map<String, String>> coachingFuture = coachingCommands.isEmpty()
                ? CompletableFuture.completedFuture(Map.of())
                : CompletableFuture.supplyAsync(() -> recommendAiPort.generateBatchReasons(
                        farmDetails, mode,
                        coachingCommands.stream().map(IndexedCommand::command).toList()),
                        recommendAiExecutor);

        CompletableFuture<Map<String, String>> newFuture = newCommands.isEmpty()
                ? CompletableFuture.completedFuture(Map.of())
                : CompletableFuture.supplyAsync(() -> recommendAiPort.generateBatchReasons(
                        farmDetails, mode,
                        newCommands.stream().map(IndexedCommand::command).toList()),
                        recommendAiExecutor);

        Map<String, String> coachingReasons = coachingFuture.join();
        Map<String, String> newReasons = newFuture.join();

        for (IndexedCommand indexed : coachingCommands) {
            CropRecommendation rec = currentCropAdvices.get(indexed.listIndex());
            String reason = sanitizeStoredAiReason(
                    resolveAiReason(coachingReasons, rec, indexed.command()));
            currentCropAdvices.set(indexed.listIndex(), rec.toBuilder().aiReason(reason).build());
        }
        for (IndexedCommand indexed : newCommands) {
            CropRecommendation rec = recommendations.get(indexed.listIndex());
            String reason = sanitizeStoredAiReason(
                    resolveAiReason(newReasons, rec, indexed.command()));
            recommendations.set(indexed.listIndex(), rec.toBuilder().aiReason(reason).build());
        }
    }

    private record IndexedCommand(
            int listIndex,
            RecommendReasonCommand command
    ) {}

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
        if (ALLOW_INDIVIDUAL_AI_REASON_FALLBACK) {
            try {
                String individual = recommendAiPort.generateReason(command);
                if (!isWeakAiReason(individual)) {
                    log.info("배치 사유 미매칭 → 개별 사유 사용: {}", rec.getCropName());
                    return individual.trim();
                }
            } catch (Exception e) {
                log.warn("개별 AI 사유 생성 실패 crop={}: {}", rec.getCropName(), e.getMessage());
            }
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


    private List<CropRecommendation> dedupeRecommendationList(List<CropRecommendation> list) {
        Map<Long, CropRecommendation> byCropId = new LinkedHashMap<>();
        for (CropRecommendation rec : list) {
            byCropId.putIfAbsent(rec.getCropId(), rec);
        }
        return new ArrayList<>(byCropId.values());
    }

    private List<CropRecommendation> dedupeCoachingList(List<CropRecommendation> list) {
        Map<String, CropRecommendation> byKey = new LinkedHashMap<>();
        for (CropRecommendation rec : list) {
            String key = rec.getRegistrationId() != null
                    ? "reg-" + rec.getRegistrationId()
                    : "crop-" + rec.getCropId() + "-" + rec.getAdviceType();
            byKey.putIfAbsent(key, rec);
        }
        return new ArrayList<>(byKey.values());
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
                .map(result -> enrichResultCoachingMetadata(farmId, result))
                .orElse(null);
    }

    private RecommendResult enrichResultCoachingMetadata(Long farmId, RecommendResult result) {
        FarmCultivationContext ctx = loadFarmCultivationContextPort.loadByFarmId(farmId);
        Map<Long, CultivationContextItem> byCropId = ctx.getItems().stream()
                .collect(Collectors.toMap(
                        CultivationContextItem::getCropId,
                        item -> item,
                        (a, b) -> a,
                        LinkedHashMap::new));

        List<CropRecommendation> coaching = attachCoachingMetadata(
                result.getCurrentCropAdvices() != null ? result.getCurrentCropAdvices() : List.of(),
                byCropId, true);
        List<CropRecommendation> recommendations = attachCoachingMetadata(
                result.getRecommendations() != null ? result.getRecommendations() : List.of(),
                byCropId, false);

        return result.toBuilder()
                .currentCropAdvices(coaching)
                .recommendations(recommendations)
                .build();
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