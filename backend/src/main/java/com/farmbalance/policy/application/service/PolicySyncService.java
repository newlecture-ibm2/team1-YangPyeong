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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            List.of("청년농", "귀농귀촌", "스마트농업", "농기계", "재배지원", "판로지원", "여성농업", "축산", "친환경", "교육", "금융지원", "기타");

    /**
     * 지역명 → regions.code 캐시.
     * sync 사이클마다 초기화되어 동일 이름의 반복 DB 조회를 방지합니다.
     * key: 지역명 ("양평군", "경기도" 등), value: regions.code (null이면 조회 실패)
     */
    private final Map<String, Optional<String>> regionCodeCache = new HashMap<>();

    /**
     * 텍스트 기반 지역 추론에 사용할 키워드 → 조회할 지역명 매핑.
     * 본문에 키워드가 포함되면 해당 지역명으로 regions 테이블을 조회합니다.
     * 순서가 중요: 더 구체적인(하위) 지역이 먼저 매칭됩니다.
     */
    private static final List<Map.Entry<String, String>> REGION_KEYWORDS = List.of(
            Map.entry("양평", "양평군"),
            Map.entry("가평", "가평군"),
            Map.entry("경기도", "경기도"),
            Map.entry("경기", "경기도")
    );

    @Override
    public SyncResult syncPolicies() {
        // sync 사이클 시작 시 region 캐시 초기화
        regionCodeCache.clear();

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

                        // ── STEP 3: Correct (region/category/date/content) ──
                        if (policyData.getTitle() == null || policyData.getTitle().isBlank()) {
                            extractFieldsFromContent(policyData);
                        }
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

        return new SyncResult(totalFetched, totalCreated, totalUpdated,
                totalAnalyzed, totalSkipped, totalFailed, warnings);
    }

    // ────────────────────────────────────────────────────────
    // 기존 데이터 재정규화 — content 파싱 기반
    // ────────────────────────────────────────────────────────

    @Override
    public ReprocessResult reprocessExisting() {
        regionCodeCache.clear();

        List<PolicyData> allPolicies = policySavePort.findAll();
        int total = allPolicies.size();
        int updated = 0;
        int failed = 0;
        List<String> warnings = new ArrayList<>();

        log.info("[Reprocess] 기존 정책 재정규화 시작 — 전체 {}건", total);

        for (PolicyData policy : allPolicies) {
            try {
                boolean changed = false;

                // 1. content에서 title/organization/target 파싱
                if (policy.getTitle() == null || policy.getTitle().isBlank()) {
                    changed |= extractFieldsFromContent(policy);
                }

                // 2. HTML 정제 + category 분류 + region_code 추론
                correctFields(policy, warnings);
                changed = true; // correctFields는 항상 보정 시도

                if (changed) {
                    policySavePort.save(policy);
                    updated++;
                    log.info("[Reprocess] 보정 완료 — id={}, title='{}', category='{}', regionCode='{}'",
                            policy.getId(), policy.getTitle(), policy.getCategory(), policy.getRegionCode());
                }
            } catch (Exception e) {
                failed++;
                log.warn("[Reprocess] 보정 실패 — id={}: {}", policy.getId(), e.getMessage());
                warnings.add(String.format("id=%d 보정 실패: %s", policy.getId(), e.getMessage()));
            }
        }

        log.info("[Reprocess] 재정규화 완료 — total={}, updated={}, failed={}", total, updated, failed);
        return new ReprocessResult(total, updated, failed, warnings);
    }

    /**
     * content 필드에서 구조화된 필드를 파싱합니다.
     * Gov24 데이터의 content 형식: "서비스명: XXX\n서비스목적요약: XXX\n지원대상: XXX\n..."
     *
     * @return 하나라도 추출 성공하면 true
     */
    private boolean extractFieldsFromContent(PolicyData policy) {
        String content = policy.getContent();
        if (content == null || content.isBlank()) return false;

        boolean extracted = false;

        // 서비스명/사업명/정책명/공고명 → title (수정된 안전한 추출)
        String title = extractTitleSafely(content);
        if (title != null && !title.isBlank()) {
            policy.setTitle(title);
            extracted = true;
        }

        // 소관기관명 → organization
        String org = extractField(content, "소관기관명");
        if (org != null && !org.isBlank()) {
            policy.setOrganization(org);
            extracted = true;
        }

        // 지원대상 → target
        String target = extractField(content, "지원대상");
        if (target != null && !target.isBlank()) {
            // 200자 제한
            if (target.length() > 200) target = target.substring(0, 197) + "...";
            policy.setTarget(target);
            extracted = true;
        }

        // 지원내용 → supportAmount (간단한 금액 추출 시도)
        String supportContent = extractField(content, "지원내용");
        if (supportContent != null && policy.getSupportAmount() == null) {
            policy.setSupportAmount(supportContent.length() > 100
                    ? supportContent.substring(0, 97) + "..." : supportContent);
            extracted = true;
        }

        return extracted;
    }

    /**
     * 정규식을 이용하여 본문 침범 없이 짧은 제목만 안전하게 추출합니다.
     */
    private String extractTitleSafely(String content) {
        if (content == null || content.isBlank()) return null;

        java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                "(?:서비스명|사업명|정책명|공고명)\\s*:\\s*(.*?)(?=\\n|서비스목적요약:|지원대상:|지원내용:|선정기준:|신청기한:|신청방법:|소관기관명:|전화문의:|$)",
                java.util.regex.Pattern.DOTALL).matcher(content);

        if (m.find()) {
            String title = m.group(1);
            // 연속 공백 및 캐리지 리턴 제거
            title = title.replaceAll("[\\r\\n]+", " ").replaceAll("\\s+", " ").trim();
            // 최대 80자 제한
            if (title.length() > 80) {
                title = title.substring(0, 80).trim();
            }
            return title;
        }
        return null;
    }

    /**
     * "필드명: 값" 패턴에서 값을 추출합니다.
     * 다음 필드명이 나올 때까지의 텍스트를 반환합니다.
     */
    private String extractField(String content, String fieldName) {
        String prefix = fieldName + ":";
        int start = content.indexOf(prefix);
        if (start < 0) {
            // "필드명: " (한칸 공백 포함) 시도
            prefix = fieldName + ": ";
            start = content.indexOf(prefix);
            if (start < 0) return null;
        }

        int valueStart = start + prefix.length();

        // 다음 필드의 시작 위치를 찾음 (줄바꿈 후 "XXX:" 패턴)
        String[] knownFields = {"서비스명", "서비스목적요약", "지원대상", "지원내용",
                "선정기준", "신청기한", "신청방법", "소관기관명", "전화문의"};
        int end = content.length();
        for (String nextField : knownFields) {
            if (nextField.equals(fieldName)) continue;
            int nextPos = content.indexOf("\n" + nextField + ":", valueStart);
            if (nextPos > 0 && nextPos < end) {
                end = nextPos;
            }
        }

        String value = content.substring(valueStart, end).trim();
        // 캐리지리턴/개행 정리
        value = value.replaceAll("[\\r\\n]+", " ").replaceAll("\\s+", " ").trim();
        return value.isBlank() ? null : value;
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
        policyData.setOrganization(truncate(result.organization(), 200));
        policyData.setCategory(result.category());
        policyData.setTarget(truncate(result.target(), 200));
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

    private void correctFields(PolicyData policyData, List<String> warnings) {
        cleanContent(policyData);
        correctRegionCode(policyData, warnings);
        correctCategory(policyData, warnings);
    }

    /**
     * HTML 태그 제거 및 500자 요약 보정
     */
    private void cleanContent(PolicyData policyData) {
        String content = policyData.getContent();
        if (content == null || content.isBlank()) {
            policyData.setContent("상세 내용이 제공되지 않았습니다.");
            return;
        }

        // HTML 태그 제거 및 공백 정규화
        String cleaned = content.replaceAll("<[^>]*>", " ")
                .replaceAll("\\s+", " ")
                .trim();

        // 500자 요약
        if (cleaned.length() > 500) {
            cleaned = cleaned.substring(0, 497) + "...";
        }
        policyData.setContent(cleaned);
    }

    private void correctRegionCode(PolicyData policyData, List<String> warnings) {
        String raw = policyData.getRegionCode();

        // 1차: AI/소스가 region_code를 이미 제공한 경우 → DB 보정만 수행
        if (raw != null && !raw.isBlank()) {
            String resolved = resolveRegionCodeCached(raw);
            if (resolved != null) {
                if (!resolved.equals(raw)) {
                    warnings.add(SyncWarningType.REGION_CORRECTION
                            .format(policyData.getExternalId(),
                                    String.format("region_code 보정: '%s' → '%s'", raw, resolved)));
                }
                policyData.setRegionCode(resolved);
                log.info("[PolicySync] Policy '{}' linked to region code='{}'",
                        policyData.getTitle(), resolved);
            } else {
                warnings.add(SyncWarningType.REGION_MATCH_FAILED
                        .format(policyData.getExternalId(),
                                String.format("region_code 매칭 실패: '%s' → null (skip)", raw)));
                log.warn("[PolicySync] region_code 매칭 실패: '{}' — externalId={}", raw, policyData.getExternalId());
                policyData.setRegionCode(null);
            }
            return;
        }

        // 2차: region_code가 없으면 텍스트 기반 추론
        String resolvedCode = resolveRegionCodeFromText(policyData);
        if (resolvedCode != null) {
            policyData.setRegionCode(resolvedCode);
            log.info("[PolicySync] Policy '{}' linked to region code='{}' (텍스트 추론)",
                    policyData.getTitle(), resolvedCode);
            warnings.add(SyncWarningType.REGION_CORRECTION
                    .format(policyData.getExternalId(),
                            String.format("텍스트 추론 → region code='%s'", resolvedCode)));
        } else {
            // 매칭 실패 → null 유지, SUPPORTS 관계 미생성, scope=NATIONAL 처리
            policyData.setRegionCode(null);
            log.info("[PolicySync] region 추론 불가 — externalId={}, NATIONAL scope 처리",
                    policyData.getExternalId());
        }
    }

    /**
     * 정책 텍스트(제목/기관/대상/내용)에서 지역 키워드를 감지하여
     * regions 테이블의 실제 code를 조회합니다.
     *
     * @return 매칭된 regions.code, 없으면 null
     */
    private String resolveRegionCodeFromText(PolicyData policyData) {
        String combinedText = String.format("%s %s %s %s",
                nullSafe(policyData.getTitle()),
                nullSafe(policyData.getOrganization()),
                nullSafe(policyData.getTarget()),
                nullSafe(policyData.getContent()));

        // REGION_KEYWORDS 순서대로 검사 (구체적 지역 우선)
        for (Map.Entry<String, String> entry : REGION_KEYWORDS) {
            if (combinedText.contains(entry.getKey())) {
                String regionName = entry.getValue();
                String code = resolveRegionCodeCached(regionName);
                if (code != null) {
                    log.info("[PolicySync] Resolved region '{}' -> code='{}'", regionName, code);
                    return code;
                } else {
                    log.warn("[PolicySync] 텍스트에서 '{}' 감지했으나 regions 테이블에서 '{}' 매칭 실패",
                            entry.getKey(), regionName);
                }
            }
        }

        return null; // 매칭 실패
    }

    /**
     * 캐시를 활용한 region code 조회.
     * 동일 sync 사이클 내에서 같은 이름/코드에 대한 반복 DB 쿼리를 방지합니다.
     *
     * @param codeOrName 지역코드 또는 지역명
     * @return regions.code, 매칭 실패 시 null
     */
    private String resolveRegionCodeCached(String codeOrName) {
        if (codeOrName == null || codeOrName.isBlank()) return null;

        return regionCodeCache
                .computeIfAbsent(codeOrName, key -> regionCodeResolvePort.resolveToCode(key))
                .orElse(null);
    }

    private void correctCategory(PolicyData policyData, List<String> warnings) {
        String cat = policyData.getCategory();
        if (cat != null && VALID_CATEGORIES.contains(cat) && !"기타".equals(cat)) {
            return; // 이미 유효한 카테고리가 있으면 패스
        }

        // 키워드 기반 자동 분류 — 제목 + 대상 + 설명 + 지원내용 합쳐서 분류
        String combinedText = String.format("%s %s %s %s",
                nullSafe(policyData.getTitle()),
                nullSafe(policyData.getTarget()),
                nullSafe(policyData.getContent()),
                nullSafe(policyData.getSupportAmount()));
        
        String inferredCategory = inferCategoryByKeyword(combinedText);
        
        if (inferredCategory != null) {
            policyData.setCategory(inferredCategory);
            warnings.add(SyncWarningType.CATEGORY_CORRECTION
                    .format(policyData.getExternalId(),
                            String.format("자동 카테고리 분류 적용: '%s'", inferredCategory)));
        } else {
            policyData.setCategory("기타");
            warnings.add(SyncWarningType.CATEGORY_CORRECTION
                    .format(policyData.getExternalId(), "카테고리 추론 실패 → '기타'"));
        }
    }

    private String inferCategoryByKeyword(String text) {
        if (text == null || text.isBlank()) return null;
        if (text.contains("청년") || text.contains("후계농") || text.contains("대학생")) return "청년농";
        if (text.contains("귀농") || text.contains("귀촌") || text.contains("정착")) return "귀농귀촌";
        if (text.contains("스마트팜") || text.contains("ICT") || text.contains("정보화") || text.contains("자동화")) return "스마트농업";
        if (text.contains("농기계") || text.contains("트랙터") || text.contains("건조기") || text.contains("관리기") || text.contains("임대사업")) return "농기계";
        if (text.contains("여성") || text.contains("출산") || text.contains("보육") || text.contains("여성농업인")) return "여성농업";
        if (text.contains("축산") || text.contains("한우") || text.contains("양돈") || text.contains("가축") || text.contains("사료") || text.contains("낙농")) return "축산";
        if (text.contains("친환경") || text.contains("무농약") || text.contains("유기농") || text.contains("탄소") || text.contains("저탄소")) return "친환경";
        if (text.contains("교육") || text.contains("컨설팅") || text.contains("세미나") || text.contains("연수")) return "교육";
        if (text.contains("융자") || text.contains("대출") || text.contains("이자") || text.contains("자금") || text.contains("보증")) return "금융지원";
        if (text.contains("판로") || text.contains("유통") || text.contains("마케팅") || text.contains("수출") || text.contains("직거래") || text.contains("로컬푸드")) return "판로지원";
        if (text.contains("비료") || text.contains("농약") || text.contains("종자") || text.contains("방제") || text.contains("영농자재") || text.contains("재배")) return "재배지원";
        return null;
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
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

    private String truncate(String val, int maxLen) {
        if (val == null) return null;
        return val.length() > maxLen ? val.substring(0, maxLen - 3) + "..." : val;
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
