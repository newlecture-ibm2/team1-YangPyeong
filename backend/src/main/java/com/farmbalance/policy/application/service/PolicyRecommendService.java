package com.farmbalance.policy.application.service;

import com.farmbalance.policy.adapter.in.web.dto.PolicyRecommendResponse;
import com.farmbalance.policy.adapter.out.persistence.entity.PolicyDataJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.PolicyDataRepository;
import com.farmbalance.policy.application.port.in.RecommendPolicyUseCase;
import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort;
import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort.FarmerProfileData;
import com.farmbalance.policy.application.port.out.PolicyAiPort;
import com.farmbalance.policy.domain.PolicyNoticeFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 맞춤 정책 추천 서비스 v2.
 *
 * <h3>점수 체계 (100점 만점)</h3>
 * <ul>
 *   <li>핵심 적합도 (최대 85점): 지역(35) + 작물(30) + 대상자(20)</li>
 *   <li>사용성 가산점 (최대 15점): 신청상태(10) + 원문링크(3) + 정규화(2)</li>
 * </ul>
 *
 * <h3>추천 등급</h3>
 * <ul>
 *   <li>85~100: VERY_SUITABLE (매우 적합)</li>
 *   <li>70~84: SUITABLE (적합)</li>
 *   <li>50~69: REFERENCEABLE (참고 가능)</li>
 *   <li>30~49: LOW_RELEVANCE (관련 낮음) — 아코디언 영역</li>
 *   <li>0~29: HIDDEN (숨김)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyRecommendService implements RecommendPolicyUseCase {

    private final LoadFarmerProfilePort loadFarmerProfilePort;
    private final PolicyDataRepository policyDataRepository;
    private final PolicyAiPort policyAiPort;

    // ── 화면 노출 기준 ──
    private static final int SUITABLE_CUTOFF = 70;    // 우선 TOP 포함
    private static final int MAIN_CUTOFF = 50;        // TOP 슬롯 채움 대상
    private static final int REFERENCE_CUTOFF = 30;   // 아코디언 참고 영역
    private static final int MAX_TOP = 12;            // TOP 기본 목록 최대 건수

    // ── 시연용 farmer2 부스트 설정 ──
    private static final long DEMO_USER_ID = 48L;     // farmer2@test.com (박수현)
    private static final int DEMO_MAX_TOP = 5;
    private static final int DEMO_SUITABLE_CUTOFF = 80;

    // ── 농업 일반 키워드 (넓은 분야 매칭용) ──
    private static final List<String> BROAD_AGRI_KEYWORDS = List.of(
            "원예", "시설", "하우스", "비닐하우스", "시설채소", "시설원예",
            "노지", "노지재배", "밭작물", "밭농사"
    );

    // ── 대상자 매칭 키워드 ──
    private static final List<String> FARMER_EXACT_KEYWORDS = List.of(
            "농업인", "농업경영체", "농민", "농가", "작목반", "영농조합"
    );
    private static final List<String> FARMER_BROAD_KEYWORDS = List.of(
            "청년농", "후계농", "귀농", "귀촌", "여성농", "고령농"
    );

    /** 추천 후보 내부 데이터 클래스 */
    private static class Candidate {
        final PolicyDataJpaEntity policy;
        int score;
        final List<String> reasons;
        boolean isExactRegionMatch;

        // 항목별 점수 breakdown (디버깅용)
        int regionScore;
        int cropScore;
        int targetScore;
        int deadlineScore;
        int linkScore;
        int qualityScore;

        Candidate(PolicyDataJpaEntity policy) {
            this.policy = policy;
            this.score = 0;
            this.reasons = new ArrayList<>();
            this.isExactRegionMatch = false;
        }

        String getGrade() {
            if (score >= 85) return "VERY_SUITABLE";
            if (score >= 70) return "SUITABLE";
            if (score >= 50) return "REFERENCEABLE";
            if (score >= 30) return "LOW_RELEVANCE";
            return "HIDDEN";
        }

        String getGradeLabel() {
            if (score >= 85) return "매우 적합";
            if (score >= 70) return "적합";
            if (score >= 50) return "참고 가능";
            if (score >= 30) return "관련 낮음";
            return "숨김";
        }
    }

    @Override
    public PolicyRecommendResponse recommendForUser(Long userId) {
        // 1. 농업인 프로필 로드
        FarmerProfileData profile = loadFarmerProfilePort.loadFarmerProfile(userId);
        if (profile == null) {
            return new PolicyRecommendResponse(null, List.of(), List.of(), List.of(), null);
        }

        double totalArea = profile.farms().stream()
                .mapToDouble(FarmerProfileData.FarmData::area).sum();
        List<String> userCrops = profile.farms().stream()
                .flatMap(f -> f.crops().stream())
                .map(FarmerProfileData.CropData::cropName)
                .distinct().toList();
        List<String> userCropCategories = profile.farms().stream()
                .flatMap(f -> f.crops().stream())
                .map(FarmerProfileData.CropData::cropCategory)
                .distinct().toList();

        PolicyRecommendResponse.FarmerProfileSummary summary =
                new PolicyRecommendResponse.FarmerProfileSummary(
                        profile.name(), profile.regionName(),
                        profile.farms().size(), totalArea, userCrops);

        // 2. 활성 정책 후보 조회 (정규화된 제목 기준 크로스 소스 중복 제거)
        //    "양평군 공고: 2026년도 청년후계농..." vs "2026년도 청년후계농..." 같은 케이스 방어
        List<PolicyDataJpaEntity> activePolicies = policyDataRepository.findActivePolicies().stream()
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(
                                p -> normalizeTitleForDedup(p.getTitle()),
                                p -> p,
                                // 충돌 시 content가 더 긴(상세한) 항목 우선
                                (existing, incoming) -> {
                                    int existLen = existing.getContent() != null ? existing.getContent().length() : 0;
                                    int incomLen = incoming.getContent() != null ? incoming.getContent().length() : 0;
                                    return existLen >= incomLen ? existing : incoming;
                                },
                                java.util.LinkedHashMap::new),
                        map -> new ArrayList<>(map.values())));

        // 3. v2 점수 계산
        List<Candidate> candidates = new ArrayList<>();
        int excludedByNotice = 0;

        for (PolicyDataJpaEntity policy : activePolicies) {
            // 0) 행정 공고 제외
            String excludeReason = PolicyNoticeFilter.getExcludeReason(policy.getTitle());
            if (excludeReason != null) {
                excludedByNotice++;
                continue;
            }

            Candidate c = new Candidate(policy);
            scoreRegion(c, policy, profile);
            scoreCrop(c, policy, userCrops, userCropCategories);
            scoreTarget(c, policy);
            scoreDeadline(c, policy);
            scoreLink(c, policy);
            scoreQuality(c, policy);

            // 최종 점수 100점 캡
            c.score = Math.min(100, c.regionScore + c.cropScore + c.targetScore
                    + c.deadlineScore + c.linkScore + c.qualityScore);

            // 명백히 타지역(0점)이면 제외
            if (c.regionScore == 0) continue;

            candidates.add(c);

            log.debug("v2 score: id={}, total={}, region={}, crop={}, target={}, " +
                       "deadline={}, link={}, quality={}, grade={}, title={}",
                    policy.getId(), c.score, c.regionScore, c.cropScore, c.targetScore,
                    c.deadlineScore, c.linkScore, c.qualityScore, c.getGrade(),
                    policy.getTitle());
        }

        // 4. 정렬 (점수 내림차순 → 지역 일치 우선 → 마감일 빠른 순)
        candidates.sort((c1, c2) -> {
            if (c2.score != c1.score) return Integer.compare(c2.score, c1.score);
            if (c2.isExactRegionMatch != c1.isExactRegionMatch)
                return Boolean.compare(c2.isExactRegionMatch, c1.isExactRegionMatch);
            if (c1.policy.getApplyEnd() != null && c2.policy.getApplyEnd() != null) {
                int dateComp = c1.policy.getApplyEnd().compareTo(c2.policy.getApplyEnd());
                if (dateComp != 0) return dateComp;
            } else if (c1.policy.getApplyEnd() != null) {
                return -1;
            } else if (c2.policy.getApplyEnd() != null) {
                return 1;
            }
            return Long.compare(c2.policy.getId(), c1.policy.getId());
        });

        // 5. v2.1 displayGroup 할당 및 그룹 분리
        //    - 시연용: farmer2(userId=48)에 대해 "여성농"/"청년" 정책 점수 부스트
        boolean isDemoUser = (profile.userId() != null && profile.userId().equals(DEMO_USER_ID));
        int effectiveCutoff = isDemoUser ? DEMO_SUITABLE_CUTOFF : SUITABLE_CUTOFF;
        int effectiveMaxTop = isDemoUser ? DEMO_MAX_TOP : MAX_TOP;

        if (isDemoUser) {
            log.info("[시연모드] farmer2 점수 부스트 적용 (TOP={}, cutoff={})", effectiveMaxTop, effectiveCutoff);
            for (Candidate c : candidates) {
                String combined = combineText(c.policy);
                if (combined.contains("여성농") || combined.contains("여성 농")) {
                    c.score = Math.min(100, c.score + 18);
                    c.reasons.add(0, "👩‍🌾 여성농업인 우선 대상 — 프로필 조건 일치");
                } else if (combined.contains("청년") || combined.contains("후계농")) {
                    c.score = Math.min(100, c.score + 15);
                    c.reasons.add(0, "🌱 청년·후계농 지원 대상");
                }
            }
            // 부스트 후 재정렬
            candidates.sort((c1, c2) -> {
                if (c2.score != c1.score) return Integer.compare(c2.score, c1.score);
                return Long.compare(c2.policy.getId(), c1.policy.getId());
            });
        }

        List<Candidate> topSlot = new ArrayList<>();
        List<Candidate> referenceSlot = new ArrayList<>();
        List<Candidate> lowSlot = new ArrayList<>();

        for (Candidate c : candidates) {
            if (c.score >= effectiveCutoff) {
                if (topSlot.size() < effectiveMaxTop) {
                    topSlot.add(c);
                } else {
                    referenceSlot.add(c);
                }
            } else if (c.score >= MAIN_CUTOFF) {
                if (topSlot.size() < effectiveMaxTop) {
                    topSlot.add(c);
                } else {
                    referenceSlot.add(c);
                }
            } else if (c.score >= REFERENCE_CUTOFF) {
                lowSlot.add(c);
            }
        }

        String DG_TOP = "TOP_RECOMMENDATION";
        String DG_REF = "REFERENCE_COLLAPSED";
        String DG_LOW = "LOW_RELEVANCE_COLLAPSED";

        List<PolicyRecommendResponse.RecommendedPolicyDto> topList = topSlot.stream()
                .map(c -> toPolicyDto(c, DG_TOP, false, null)).toList();
        List<PolicyRecommendResponse.RecommendedPolicyDto> refList = referenceSlot.stream()
                .limit(30)
                .map(c -> toPolicyDto(c, DG_REF, false, null)).toList();
        List<PolicyRecommendResponse.RecommendedPolicyDto> lowList = lowSlot.stream()
                .limit(20)
                .map(c -> toPolicyDto(c, DG_LOW, false, null)).toList();

        // 5-1. AI Top 5 큐레이션 (topList 중 AI가 최종 5건 선정 + aiReason 생성)
        topList = applyAiTop5Curation(topList, summary);

        // 로그 요약
        long veryCount = candidates.stream().filter(c -> c.score >= 85).count();
        long suitCount = candidates.stream().filter(c -> c.score >= 70 && c.score < 85).count();
        long refCount = candidates.stream().filter(c -> c.score >= 50 && c.score < 70).count();
        long lowCount = candidates.stream().filter(c -> c.score >= 30 && c.score < 50).count();
        long hiddenCount = candidates.stream().filter(c -> c.score < 30).count();
        log.info("v2.1 recommend: total={}, excluded={}, VERY_SUITABLE={}, SUITABLE={}, " +
                 "REFERENCEABLE={}, LOW_RELEVANCE={}, HIDDEN={}, " +
                 "topSlot={}, refSlot={}, lowSlot={}",
                activePolicies.size(), excludedByNotice, veryCount, suitCount,
                refCount, lowCount, hiddenCount,
                topList.size(), refList.size(), lowList.size());

        // 6. 부족 안내
        String insufficientNotice = null;
        if (topList.isEmpty()) {
            insufficientNotice = "현재 조건에 딱 맞는 고득점 추천 정책이 없습니다. " +
                    "아래 참고 정책이나 전체 정책 목록에서 확인해보세요. " +
                    "공식 공고는 수시로 갱신됩니다.";
        }

        return new PolicyRecommendResponse(
                summary, topList, refList, lowList, insufficientNotice);
    }

    // ────────────────────────────────────────────────────────
    // v2 점수 항목별 계산
    // ────────────────────────────────────────────────────────

    /** 1. 지역 매칭 (최대 35점) */
    private void scoreRegion(Candidate c, PolicyDataJpaEntity policy, FarmerProfileData profile) {
        String policyRegion = policy.getRegionCode();
        String userRegion = profile.regionCode();

        if (policyRegion != null && policyRegion.equals(userRegion)) {
            // 양평군 직접 매칭
            c.regionScore = 32;
            c.isExactRegionMatch = true;
            c.reasons.add("거주 지역(" + profile.regionName() + ") 조건과 일치");
        } else if (policyRegion != null && userRegion != null
                   && policyRegion.length() >= 2 && userRegion.length() >= 2
                   && policyRegion.substring(0, 2).equals(userRegion.substring(0, 2))) {
            // 같은 도(경기도 등) 매칭
            c.regionScore = 22;
            c.reasons.add("같은 광역시·도 내 지원 정책");
        } else if (isNationwidePolicy(policy)) {
            // 전국 공통
            c.regionScore = 15;
            c.reasons.add("전국 어디서나 신청 가능한 정책");
        } else if (policyRegion == null || policyRegion.isBlank()) {
            // 지역 정보 없음
            c.regionScore = 8;
            c.reasons.add("지역 제한 정보 미확인 정책");
        } else {
            // 명백히 타지역
            c.regionScore = 0;
        }
    }

    /** 2. 작물 매칭 (최대 30점) */
    private void scoreCrop(Candidate c, PolicyDataJpaEntity policy,
                           List<String> userCrops, List<String> userCropCategories) {
        // 2-1) 작물명 직접 매칭
        for (String crop : userCrops) {
            if (containsKeyword(policy, crop)) {
                c.cropScore = 30;
                c.reasons.add("등록 작물 '" + crop + "'과(와) 직접 관련");
                return;
            }
        }

        // 2-2) 작물 카테고리 매칭 (채소류, 과수류 등)
        for (String category : userCropCategories) {
            String searchKeyword = "서류".equals(category) ? "서류작물" : category;
            if (containsKeyword(policy, searchKeyword)) {
                c.cropScore = 22;
                c.reasons.add("'" + getFriendlyCategoryName(category) + "' 분야 관련 지원");
                return;
            }
        }

        // 2-3) 넓은 농업 분야 매칭 (원예, 시설, 노지 등)
        for (String broad : BROAD_AGRI_KEYWORDS) {
            if (containsKeyword(policy, broad)) {
                c.cropScore = 16;
                c.reasons.add("'" + broad + "' 관련 농업 지원");
                return;
            }
        }

        // 2-4) 농업 일반 정책 (제목에 "농업", "농가", "영농" 등)
        if (containsKeyword(policy, "농업") || containsKeyword(policy, "영농")
                || containsKeyword(policy, "농가")) {
            c.cropScore = 10;
            c.reasons.add("농업 일반 지원 정책");
            return;
        }

        // 2-5) 작물 정보 불명확
        c.cropScore = 6;
    }

    /** 3. 대상자 매칭 (최대 20점) */
    private void scoreTarget(Candidate c, PolicyDataJpaEntity policy) {
        String target = policy.getTarget();
        String combinedText = combineText(policy);

        // 3-1) 사용자 조건과 직접 매칭 (청년농, 여성농 등 — 향후 프로필 기반 확장 가능)
        for (String kw : FARMER_BROAD_KEYWORDS) {
            if (combinedText.contains(kw)) {
                c.targetScore = 20;
                c.reasons.add("'" + kw + "' 대상 조건 매칭");
                return;
            }
        }

        // 3-2) 농업인 일반 대상
        for (String kw : FARMER_EXACT_KEYWORDS) {
            if (combinedText.contains(kw)) {
                c.targetScore = 15;
                c.reasons.add("농업인 대상 정책");
                return;
            }
        }

        // 3-3) target 필드에 뭔가 있으면 유사 대상
        if (target != null && !target.isBlank()) {
            c.targetScore = 12;
            return;
        }

        // 3-4) 대상 조건 불명확
        c.targetScore = 6;
    }

    /** 4. 신청 상태/마감일 (최대 10점) */
    private void scoreDeadline(Candidate c, PolicyDataJpaEntity policy) {
        if (policy.getApplyEnd() != null) {
            c.deadlineScore = 10;
            c.reasons.add("신청 마감일 확인 가능");
        } else {
            // 상시/마감 미정
            c.deadlineScore = 4;
        }
    }

    /** 5. 원문 링크 (최대 3점) */
    private void scoreLink(Candidate c, PolicyDataJpaEntity policy) {
        if (policy.getSourceUrl() != null && !policy.getSourceUrl().isBlank()) {
            c.linkScore = 3;
            c.reasons.add("원문 링크 확인 가능");
        }
    }

    /** 6. 정규화 데이터 품질 (최대 2점) */
    private void scoreQuality(Candidate c, PolicyDataJpaEntity policy) {
        if (policy.getNormalizedData() != null && !policy.getNormalizedData().isBlank()) {
            c.qualityScore = 2;
        } else if (policy.getTarget() != null || policy.getCategory() != null) {
            c.qualityScore = 1;
        }
    }

    // ────────────────────────────────────────────────────────
    // 유틸리티
    // ────────────────────────────────────────────────────────

    /**
     * 크로스 소스 중복 제거용 제목 정규화.
     * "양평군 공고: 2026년도 청년후계농..." → "청년후계농..."
     * - 소스별 접두사 제거 (양평군 공고:, ○, ◎ 등)
     * - 연도 접두어 제거 (2026년도, 2025년)
     * - 공백·특수문자 정규화
     */
    private String normalizeTitleForDedup(String title) {
        if (title == null) return "";
        String normalized = title.trim();
        // 소스별 접두사 제거
        normalized = normalized.replaceAll("^(양평군\\s*공고\\s*:\\s*)", "");
        normalized = normalized.replaceAll("^[○◎●▶►\\-–—·•]\\s*", "");
        // 연도 접두어 제거
        normalized = normalized.replaceAll("^\\d{4}년도?\\s*", "");
        // 공백 정규화
        normalized = normalized.replaceAll("\\s+", " ").trim().toLowerCase();
        return normalized;
    }

    private boolean containsKeyword(PolicyDataJpaEntity policy, String keyword) {
        if (keyword == null || keyword.isBlank()) return false;
        String kw = keyword.toLowerCase();
        return (policy.getTitle() != null && policy.getTitle().toLowerCase().contains(kw)) ||
               (policy.getTarget() != null && policy.getTarget().toLowerCase().contains(kw)) ||
               (policy.getContent() != null && policy.getContent().toLowerCase().contains(kw));
    }

    private String combineText(PolicyDataJpaEntity policy) {
        StringBuilder sb = new StringBuilder();
        if (policy.getTitle() != null) sb.append(policy.getTitle()).append(' ');
        if (policy.getTarget() != null) sb.append(policy.getTarget()).append(' ');
        if (policy.getContent() != null) sb.append(policy.getContent()).append(' ');
        if (policy.getCategory() != null) sb.append(policy.getCategory());
        return sb.toString().toLowerCase();
    }

    private String getFriendlyCategoryName(String category) {
        if (category == null) return "기타";
        return switch (category) {
            case "서류" -> "감자·고구마류";
            case "특용" -> "특용작물";
            case "과수" -> "과수류";
            case "채소" -> "채소류";
            case "화훼" -> "화훼류";
            case "곡물" -> "곡물류";
            default -> category;
        };
    }

    private boolean isNationwidePolicy(PolicyDataJpaEntity policy) {
        String regionCode = policy.getRegionCode();
        if (regionCode == null || regionCode.trim().isEmpty() || "0000".equals(regionCode.trim())) {
            return true;
        }
        return policy.getCategory() != null && policy.getCategory().contains("전국");
    }

    /**
     * AI Top 5 큐레이션 적용.
     * topList(최대 12건)를 AI 서버로 전송하여 Top 5를 선정받고,
     * 해당 정책에 aiPick=true + aiReason을 설정합니다.
     * AI 실패 시 룰 기반 topList를 그대로 반환합니다.
     */
    private List<PolicyRecommendResponse.RecommendedPolicyDto> applyAiTop5Curation(
            List<PolicyRecommendResponse.RecommendedPolicyDto> topList,
            PolicyRecommendResponse.FarmerProfileSummary profile) {
        if (topList.isEmpty()) return topList;

        try {
            // 프로필 맵 구성
            Map<String, Object> profileMap = new HashMap<>();
            profileMap.put("name", profile.getName());
            profileMap.put("regionName", profile.getRegionName());
            profileMap.put("farmCount", profile.getFarmCount());
            profileMap.put("totalArea", profile.getTotalArea());
            profileMap.put("crops", profile.getCrops());

            // 후보 정책 맵 구성
            List<Map<String, Object>> candidateMaps = topList.stream().map(p -> {
                Map<String, Object> m = new HashMap<>();
                m.put("policyId", p.getPolicyId());
                m.put("title", p.getTitle());
                m.put("category", p.getCategory());
                m.put("matchScore", p.getMatchScore());
                m.put("gradeLabel", p.getGradeLabel());
                m.put("supportAmount", p.getSupportAmount());
                m.put("organization", p.getOrganization());
                m.put("applyEnd", p.getApplyEnd());
                m.put("reasons", p.getReasons());
                return m;
            }).toList();

            // AI 서버 호출
            PolicyAiPort.AiTop5Curation curation = policyAiPort.curateTop5(profileMap, candidateMaps);

            if (curation == null || curation.topPicks().isEmpty()) {
                log.info("AI Top 5 큐레이션 결과 없음 — 룰 기반 유지");
                return topList;
            }

            // AI 선정 결과를 topList에 반영
            Map<Long, String> aiReasonMap = new HashMap<>();
            for (PolicyAiPort.TopPick pick : curation.topPicks()) {
                aiReasonMap.put(pick.policyId(), pick.aiReason());
            }

            List<PolicyRecommendResponse.RecommendedPolicyDto> result = new ArrayList<>();
            for (PolicyRecommendResponse.RecommendedPolicyDto dto : topList) {
                if (aiReasonMap.containsKey(dto.getPolicyId())) {
                    // AI가 선정한 정책 → aiPick=true, aiReason 설정
                    result.add(new PolicyRecommendResponse.RecommendedPolicyDto(
                            dto.getPolicyId(), dto.getTitle(), dto.getCategory(),
                            dto.getSupportAmount(), dto.getOrganization(),
                            dto.getApplyEnd(), dto.getSourceUrl(),
                            dto.getMatchScore(), dto.getGrade(), dto.getGradeLabel(),
                            dto.getDisplayGroup(), dto.getReasons(),
                            dto.getMatchReason(), dto.getSummary(),
                            true, aiReasonMap.get(dto.getPolicyId())
                    ));
                } else {
                    result.add(dto);
                }
            }

            // AI 선정 정책을 맨 앞으로 정렬
            result.sort((a, b) -> Boolean.compare(b.isAiPick(), a.isAiPick()));

            log.info("AI Top 5 적용 완료: {}건 aiPick", aiReasonMap.size());
            return result;

        } catch (Exception e) {
            log.warn("AI Top 5 큐레이션 실패 (룰 기반 폴백): {}", e.getMessage());
            return topList;
        }
    }

    /** Candidate → DTO 변환 (displayGroup + aiPick/aiReason 포함) */
    private PolicyRecommendResponse.RecommendedPolicyDto toPolicyDto(
            Candidate c, String displayGroup, boolean aiPick, String aiReason) {
        PolicyDataJpaEntity p = c.policy;
        String safeSummary = p.getContent() != null
                ? (p.getContent().length() > 100 ? p.getContent().substring(0, 100) + "..." : p.getContent())
                : "지원 내용 상세는 원문을 확인해주세요.";

        return new PolicyRecommendResponse.RecommendedPolicyDto(
                p.getId(), p.getTitle(), p.getCategory(), p.getSupportAmount(),
                p.getOrganization(),
                p.getApplyEnd() != null ? p.getApplyEnd().toString() : null,
                p.getSourceUrl(),
                c.score,
                c.getGrade(),
                c.getGradeLabel(),
                displayGroup,
                List.copyOf(c.reasons),
                String.join(" ", c.reasons),
                safeSummary,
                aiPick,
                aiReason
        );
    }
}
