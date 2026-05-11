package com.farmbalance.policy.application.service;

import com.farmbalance.policy.application.port.in.SyncPolicyUseCase;
import com.farmbalance.policy.application.port.out.PolicyAiAnalyzePort;
import com.farmbalance.policy.application.port.out.PolicyAiAnalyzePort.AiAnalyzeResult;
import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.application.port.out.PolicySavePort;
import com.farmbalance.policy.application.port.out.RegionCodeResolvePort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.SyncWarningType;
import com.farmbalance.global.event.ApiSyncEvent;
import com.farmbalance.global.event.HealthCheckTriggerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 정책 동기화 오케스트레이터.
 *
 * 책임: 전체 sync 흐름을 조율합니다.
 * - fetch: 외부 소스에서 raw 수집
 * - analyze: AI 서버에 정규화 분석 요청
 * - correct: region/category/date 보정
 * - persist: DB upsert
 *
 * 각 단계는 private 메서드로 분리되어 있으며,
 * 향후 fetch→raw저장→analyze→update 비동기 파이프라인 전환 시
 * 각 메서드를 별도 서비스/이벤트 핸들러로 분리 가능합니다.
 *
 * ⚠️ AI 분석 실패 시 해당 건만 skip, 전체 sync는 계속 진행됩니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PolicySyncService implements SyncPolicyUseCase {

    private final List<PolicyExternalFetchPort> fetchPorts;
    private final PolicySavePort policySavePort;
    private final PolicyAiAnalyzePort aiAnalyzePort;
    private final RegionCodeResolvePort regionCodeResolvePort;
    private final ApplicationEventPublisher eventPublisher;

    private static final List<String> VALID_CATEGORIES =
            List.of("보조금", "교육", "임대", "검정", "세금", "융자", "기타");

    @Override
    public SyncResult syncPolicies() {
        int totalFetched = 0;
        int totalCreated = 0;
        int totalUpdated = 0;
        int totalAnalyzed = 0;
        int totalSkipped = 0;
        int totalFailed = 0;
        List<String> warnings = new ArrayList<>();

        for (PolicyExternalFetchPort fetchPort : fetchPorts) {
            String sourceName = fetchPort.getSourceName();
            try {
                // ── STEP 1: Fetch ──
                log.info("[Sync] {} 소스 수집 시작", sourceName);
                List<PolicyData> fetched = fetchPort.fetchPolicies();
                totalFetched += fetched.size();

                for (PolicyData policyData : fetched) {
                    try {
                        // ── STEP 2: Analyze ──
                        boolean analyzed = enrichWithAi(policyData, warnings);
                        if (analyzed) {
                            totalAnalyzed++;
                        } else {
                            totalSkipped++;
                        }

                        // ── STEP 3: Correct (region/category/date) ──
                        correctFields(policyData, warnings);

                        // ── STEP 4: Persist ──
                        boolean isNew = upsertPolicy(policyData);
                        if (isNew) {
                            totalCreated++;
                        } else {
                            totalUpdated++;
                        }
                    } catch (Exception e) {
                        totalFailed++;
                        log.warn("[Sync] 개별 정책 처리 실패 — externalId={}, source={}: {}",
                                policyData.getExternalId(), sourceName, e.getMessage());
                        warnings.add(SyncWarningType.SYNC_SAVE_FAILED
                                .format(policyData.getExternalId(), "저장 실패: " + e.getMessage()));
                    }
                }

                log.info("[Sync] {} 소스 수집 완료 — {}건", sourceName, fetched.size());
            } catch (Exception e) {
                log.error("[Sync] {} 소스 수집 전체 실패: {}", sourceName, e.getMessage(), e);
                warnings.add(SyncWarningType.SYNC_FETCH_FAILED
                        .format(sourceName, "전체 수집 실패: " + e.getMessage()));
            }
        }

        eventPublisher.publishEvent(new ApiSyncEvent("POLICY_DATA", "SUCCESS", totalFetched, null));

        return new SyncResult(totalFetched, totalCreated, totalUpdated,
                totalAnalyzed, totalSkipped, totalFailed, warnings);
    }

    // ────────────────────────────────────────────────────────
    // STEP 2: AI 분석 — 향후 별도 서비스/이벤트로 분리 가능
    // ────────────────────────────────────────────────────────

    /**
     * AI 서버에 분석을 요청하고, 결과로 PolicyData를 보강합니다.
     * AI 실패 시 false를 반환하고 기존 데이터 그대로 진행합니다.
     *
     * @return true: AI 분석 성공, false: 스킵
     */
    private boolean enrichWithAi(PolicyData policyData, List<String> warnings) {
        try {
            Optional<AiAnalyzeResult> resultOpt = aiAnalyzePort.analyze(
                    policyData.getSource().name(),
                    policyData.getExternalId(),
                    policyData.getRawData(),
                    policyData.getContent(),
                    policyData.getSourceUrl()
            );

            if (resultOpt.isEmpty()) {
                warnings.add(SyncWarningType.AI_ANALYZE_SKIPPED
                        .format(policyData.getExternalId(), "AI 서버 응답 없음 → skip"));
                return false;
            }

            AiAnalyzeResult result = resultOpt.get();
            applyAiResult(policyData, result);

            // AI warnings 수집
            if (result.warnings() != null) {
                result.warnings().forEach(w ->
                        warnings.add(SyncWarningType.AI_LOW_CONFIDENCE
                                .format(policyData.getExternalId(), w)));
            }

            // 낮은 confidence 경고
            if (result.confidence() < 0.5) {
                warnings.add(SyncWarningType.AI_LOW_CONFIDENCE
                        .format(policyData.getExternalId(),
                                String.format("낮은 신뢰도: %.2f", result.confidence())));
            }

            return true;
        } catch (Exception e) {
            log.warn("[Sync] AI 분석 예외 — externalId={}: {}", policyData.getExternalId(), e.getMessage());
            warnings.add(SyncWarningType.AI_ANALYZE_FAILED
                    .format(policyData.getExternalId(), "예외: " + e.getMessage()));
            return false;
        }
    }

    /**
     * AI 분석 결과를 PolicyData 필드에 적용합니다.
     */
    private void applyAiResult(PolicyData policyData, AiAnalyzeResult result) {
        if (result.title() != null) policyData.setTitle(result.title());
        policyData.setOrganization(result.organization());
        policyData.setCategory(result.category());
        policyData.setTarget(result.target());
        if (result.contentSummary() != null) policyData.setContent(result.contentSummary());
        policyData.setSupportAmount(result.supportAmount());
        policyData.setConfidence(BigDecimal.valueOf(result.confidence()));
        policyData.setNormalizedData(result.normalizedJson());

        // 날짜 임시 적용 (STEP 3에서 파싱 보정)
        policyData.setApplyStart(parseDate(result.applyStart()));
        policyData.setApplyEnd(parseDate(result.applyEnd()));

        // region_code 임시 적용 (STEP 3에서 보정)
        policyData.setRegionCode(result.regionCode());
    }

    // ────────────────────────────────────────────────────────
    // STEP 3: 보정 — 향후 별도 Corrector 서비스로 분리 가능
    // ────────────────────────────────────────────────────────

    /**
     * region_code, category, date를 Java 측에서 최종 보정합니다.
     */
    private void correctFields(PolicyData policyData, List<String> warnings) {
        correctRegionCode(policyData, warnings);
        correctCategory(policyData, warnings);
    }

    private void correctRegionCode(PolicyData policyData, List<String> warnings) {
        String raw = policyData.getRegionCode();
        if (raw == null || raw.isBlank()) return;

        Optional<String> resolved = regionCodeResolvePort.resolveToCode(raw);
        if (resolved.isPresent()) {
            if (!resolved.get().equals(raw)) {
                warnings.add(SyncWarningType.REGION_CORRECTION
                        .format(policyData.getExternalId(),
                                String.format("region_code 보정: '%s' → '%s'", raw, resolved.get())));
            }
            policyData.setRegionCode(resolved.get());
        } else {
            warnings.add(SyncWarningType.REGION_MATCH_FAILED
                    .format(policyData.getExternalId(),
                            String.format("region_code 매칭 실패: '%s' → null", raw)));
            policyData.setRegionCode(null);
        }
    }

    private void correctCategory(PolicyData policyData, List<String> warnings) {
        String cat = policyData.getCategory();
        if (cat != null && VALID_CATEGORIES.contains(cat)) return;

        warnings.add(SyncWarningType.CATEGORY_CORRECTION
                .format(policyData.getExternalId(),
                        String.format("카테고리 보정: '%s' → '기타'", cat)));
        policyData.setCategory("기타");
    }

    // ────────────────────────────────────────────────────────
    // STEP 4: Persist
    // ────────────────────────────────────────────────────────

    /**
     * external_id + source 기준 upsert.
     *
     * @return true: 신규 생성, false: 기존 갱신
     */
    private boolean upsertPolicy(PolicyData incoming) {
        Optional<PolicyData> existingOpt = policySavePort
                .findByExternalIdAndSource(incoming.getExternalId(), incoming.getSource().name());

        if (existingOpt.isPresent()) {
            PolicyData existing = existingOpt.get();
            existing.setTitle(incoming.getTitle());
            existing.setOrganization(incoming.getOrganization());
            existing.setRegionCode(incoming.getRegionCode());
            existing.setCategory(incoming.getCategory());
            existing.setTarget(incoming.getTarget());
            existing.setContent(incoming.getContent());
            existing.setSupportAmount(incoming.getSupportAmount());
            existing.setApplyStart(incoming.getApplyStart());
            existing.setApplyEnd(incoming.getApplyEnd());
            existing.setSourceUrl(incoming.getSourceUrl());
            existing.setRawData(incoming.getRawData());
            existing.setNormalizedData(incoming.getNormalizedData());
            existing.setConfidence(incoming.getConfidence());
            existing.setFetchedAt(LocalDateTime.now());
            policySavePort.save(existing);
            return false;
        } else {
            incoming.setFetchedAt(LocalDateTime.now());
            policySavePort.save(incoming);
            return true;
        }
    }

    // ── 유틸리티 ──

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    @Async
    @EventListener
    public void onHealthCheckTriggerEvent(HealthCheckTriggerEvent event) {
        if (!"POLICY_DATA".equals(event.apiName())) {
            return;
        }
        log.info("[PolicySync] 정책 데이터 헬스체크 지시 수신");
        try {
            // 외부 소스 1건만 단순 호출하여 상태 확인
            if (!fetchPorts.isEmpty()) {
                fetchPorts.get(0).fetchPolicies();
            }
            eventPublisher.publishEvent(new ApiSyncEvent("POLICY_DATA", "SUCCESS", 0, null, true));
        } catch (Exception e) {
            log.error("[PolicySync] 정책 헬스체크 실패: {}", e.getMessage());
            eventPublisher.publishEvent(new ApiSyncEvent("POLICY_DATA", "FAILED", 0, e.getMessage(), true));
        }
    }
}
