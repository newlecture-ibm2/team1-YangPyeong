package com.farmbalance.policy.application.service;

import com.farmbalance.policy.adapter.in.web.dto.PolicyRecommendResponse;
import com.farmbalance.policy.adapter.out.persistence.entity.PolicyDataJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.PolicyDataRepository;
import com.farmbalance.policy.application.port.in.RecommendPolicyUseCase;
import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort;
import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort.FarmerProfileData;
import com.farmbalance.policy.application.port.out.PolicyGraphQueryPort;
import com.farmbalance.policy.application.port.out.PolicyAiPort;
import com.farmbalance.policy.domain.PolicyNoticeFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyRecommendService implements RecommendPolicyUseCase {

    private final LoadFarmerProfilePort loadFarmerProfilePort;
    private final PolicyDataRepository policyDataRepository;
    private final PolicyGraphQueryPort policyGraphQueryPort;
    private final PolicyAiPort policyAiPort;

    /** 추천 후보 내부 데이터 클래스 */
    private static class Candidate {
        final PolicyDataJpaEntity policy;
        final int score;
        final List<String> reasons;
        final boolean isExactRegionMatch;

        Candidate(PolicyDataJpaEntity policy, int score, List<String> reasons, boolean isExactRegionMatch) {
            this.policy = policy;
            this.score = score;
            this.reasons = reasons;
            this.isExactRegionMatch = isExactRegionMatch;
        }
    }

    @Override
    public PolicyRecommendResponse recommendForUser(Long userId) {
        // 1. 농업인 프로필 로드
        FarmerProfileData profile = loadFarmerProfilePort.loadFarmerProfile(userId);
        if (profile == null) {
            // 정보 없음 (농업인이 아니거나, 농장이 아예 없음)
            return new PolicyRecommendResponse(null, List.of(), List.of(), null);
        }

        double totalArea = profile.farms().stream().mapToDouble(LoadFarmerProfilePort.FarmerProfileData.FarmData::area).sum();
        List<String> userCrops = profile.farms().stream()
                .flatMap(f -> f.crops().stream())
                .map(LoadFarmerProfilePort.FarmerProfileData.CropData::cropName)
                .distinct()
                .toList();
        List<String> userCropCategories = profile.farms().stream()
                .flatMap(f -> f.crops().stream())
                .map(LoadFarmerProfilePort.FarmerProfileData.CropData::cropCategory)
                .distinct()
                .toList();

        PolicyRecommendResponse.FarmerProfileSummary summary = new PolicyRecommendResponse.FarmerProfileSummary(
                profile.name(),
                profile.regionName(),
                profile.farms().size(),
                totalArea,
                userCrops
        );

        // 2. 활성 정책 후보 조회
        List<PolicyDataJpaEntity> activePolicies = policyDataRepository.findActivePolicies();

        // 3. 점수 계산 및 추천 후보 생성

        List<Candidate> candidates = new ArrayList<>();

        int excludedByNotice = 0;
        int excludedPermit = 0;
        int excludedRecruitment = 0;
        int excludedOutsourcing = 0;
        for (PolicyDataJpaEntity policy : activePolicies) {
            // 0) 행정 공고 제외 필터 (추천 불가능한 비혜택 문서)
            String excludeReason = PolicyNoticeFilter.getExcludeReason(policy.getTitle());
            if (excludeReason != null) {
                excludedByNotice++;
                switch (excludeReason) {
                    case "excluded_permit_notice" -> excludedPermit++;
                    case "excluded_recruitment_notice" -> excludedRecruitment++;
                    case "excluded_outsourcing_notice" -> excludedOutsourcing++;
                }
                log.debug("정책 제외 - {}: policyId={}, title={}", 
                          excludeReason, policy.getId(), policy.getTitle());
                continue;
            }

            int score = 0;
            List<String> reasons = new ArrayList<>();
            boolean exactRegion = false;

            // 1) 지역 매칭
            if (policy.getRegionCode() != null && policy.getRegionCode().equals(profile.regionCode())) {
                score += 30;
                exactRegion = true;
                reasons.add("거주 지역(" + profile.regionName() + ") 농업인을 위한 맞춤형 정책입니다.");
            } else if (isNationwidePolicy(policy)) {
                score += 15;
                reasons.add("전국 어디서나 신청 가능한 공통 지원 정책입니다.");
                log.debug("전국 공통 정책 포함: policyId={}, regionCode={}, title={}", 
                          policy.getId(), policy.getRegionCode(), policy.getTitle());
            } else {
                log.debug("정책 제외 - 지역 불일치: policyId={}, regionCode={}, userRegion={}", 
                          policy.getId(), policy.getRegionCode(), profile.regionCode());
                continue; 
            }

            // 2) 작물 직접 매칭
            boolean cropMatched = false;
            for (String crop : userCrops) {
                if (containsKeyword(policy, crop)) {
                    score += 25;
                    reasons.add("현재 재배 중인 '" + crop + "' 작물 지원 조건이 포함되어 있습니다.");
                    cropMatched = true;
                    break;
                }
            }

            // 3) 작물 카테고리 매칭
            if (!cropMatched) {
                for (String category : userCropCategories) {
                    String searchKeyword = "서류".equals(category) ? "서류작물" : category;
                    if (containsKeyword(policy, searchKeyword)) {
                        score += 15;
                        reasons.add("재배 중인 '" + getFriendlyCategoryName(category) + "' 관련 지원일 가능성이 있습니다.");
                        break;
                    }
                }
            }

            // 4) 신청 마감일 우대
            if (policy.getApplyEnd() != null) {
                score += 10;
                reasons.add("신청 기한이 명시된 정책으로, 기간 내 접수가 가능합니다.");
            }

            // 5) 원문 링크 정보 가점
            if (policy.getSourceUrl() != null && !policy.getSourceUrl().isBlank()) {
                score += 5;
                reasons.add("공식 웹사이트를 통해 상세한 공고 확인이 가능합니다.");
            }

            // 6) 정규화 데이터 품질 가점
            if (policy.getNormalizedData() != null && !policy.getNormalizedData().isBlank()) {
                score += 5;
            }

            // 점수가 있는 후보는 일단 모두 추가 (최소 기준은 아래에서 동적 결정)
            if (score > 0) { 
                candidates.add(new Candidate(policy, score, reasons, exactRegion));
            }
        }

        // 4. 정렬 (점수 내림차순 -> 지역 일치 우선 -> 마감일 빠른 순 -> ID 내림차순)
        candidates.sort((c1, c2) -> {
            if (c2.score != c1.score) return Integer.compare(c2.score, c1.score);
            if (c2.isExactRegionMatch != c1.isExactRegionMatch) return Boolean.compare(c2.isExactRegionMatch, c1.isExactRegionMatch);
            
            // 마감일 오름차순 (null은 뒤로)
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

        // 5. 상세 로그 (지역/전국 분류)
        long localCount = candidates.stream().filter(c -> c.isExactRegionMatch).count();
        long nationwideCount = candidates.stream().filter(c -> !c.isExactRegionMatch).count();
        log.info("policy raw={}, excludedTotal={} (permit={}, recruitment={}, outsourcing={}, other={}), " +
                 "recommendableLocal={}, recommendableNationwide={}, totalCandidates={}",
                activePolicies.size(), excludedByNotice, excludedPermit, excludedRecruitment, excludedOutsourcing,
                excludedByNotice - excludedPermit - excludedRecruitment - excludedOutsourcing,
                localCount, nationwideCount, candidates.size());

        // 6. TOP 5 추출 (AI 사유 생성 대상)
        List<Candidate> top5Candidates = candidates.stream().limit(5).toList();
        List<PolicyDataJpaEntity> top5Policies = top5Candidates.stream().map(c -> c.policy).toList();
        List<Long> top5PolicyIds = top5Policies.stream().map(PolicyDataJpaEntity::getId).toList();

        // 6. GraphRAG 릴레이션 조회 (TOP 5만)
        List<Map<String, Object>> graphRelations = policyGraphQueryPort.findRelationsForFarmerAndPolicies(userId, top5PolicyIds);

        // 7. AI 추천 사유 생성 데이터 준비 (TOP 5만)
        Map<String, Object> farmerProfileMap = new java.util.HashMap<>();
        farmerProfileMap.put("name", profile.name());
        farmerProfileMap.put("regionName", profile.regionName());
        farmerProfileMap.put("totalArea", totalArea);
        farmerProfileMap.put("crops", userCrops);

        List<Map<String, Object>> candidatePoliciesMap = top5Policies.stream().map(p -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("policyId", p.getId());
            map.put("title", p.getTitle());
            map.put("category", p.getCategory());
            map.put("supportAmount", p.getSupportAmount());
            return map;
        }).toList();

        // 8. AI 초개인화 사유 요청 (TOP 5만)
        PolicyAiPort.AiPolicyRecommendation aiResult = policyAiPort.generatePolicyReason(userId, farmerProfileMap, graphRelations, candidatePoliciesMap);
        Map<Long, PolicyAiPort.PolicyReason> aiReasonMap = aiResult.reasons() != null ? 
            aiResult.reasons().stream().collect(java.util.stream.Collectors.toMap(PolicyAiPort.PolicyReason::policyId, r -> r, (r1, r2) -> r1)) : Map.of();

        log.info("ai_reason_generated={}", aiReasonMap.size());

        // 9. TOP 5 DTO 변환 (AI 사유 포함)
        List<PolicyRecommendResponse.RecommendedPolicyDto> topRecommendations = top5Candidates.stream()
                .map(c -> toPolicyDto(c, aiReasonMap))
                .toList();

        // 10. 관련 정책 DTO 변환 (규칙 기반 사유, AI 호출 없음, 최대 20개)
        List<PolicyRecommendResponse.RecommendedPolicyDto> relatedPolicies = candidates.stream()
                .skip(5)
                .limit(20)
                .map(c -> toPolicyDto(c, Map.of()))
                .toList();

        log.info("final_recommended={} (top5={}, related={})", 
                topRecommendations.size() + relatedPolicies.size(), topRecommendations.size(), relatedPolicies.size());

        // 11. 후보 부족 시 안내 메시지
        String insufficientNotice = null;
        int totalRecommendable = topRecommendations.size() + relatedPolicies.size();
        if (topRecommendations.size() < 5) {
            insufficientNotice = "현재 조건에 맞는 지원사업이 많지 않습니다. " +
                    "전국 단위 지원사업과 양평군 관련 정책을 함께 확인해보세요. " +
                    "공식 공고는 수시로 갱신됩니다.";
            log.info("insufficient_notice: recommendedPolicies={}, totalRecommendable={}", 
                    topRecommendations.size(), totalRecommendable);
        }

        return new PolicyRecommendResponse(summary, topRecommendations, relatedPolicies, insufficientNotice);
    }

    private boolean containsKeyword(PolicyDataJpaEntity policy, String keyword) {
        if (keyword == null || keyword.isBlank()) return false;
        String kw = keyword.toLowerCase();
        return (policy.getTitle() != null && policy.getTitle().toLowerCase().contains(kw)) ||
               (policy.getTarget() != null && policy.getTarget().toLowerCase().contains(kw)) ||
               (policy.getContent() != null && policy.getContent().toLowerCase().contains(kw));
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

    /**
     * 전국 공통 정책 여부를 판별합니다.
     * - regionCode가 null / 빈 문자열 / "0000" → 전국
     * - category에 "전국" 포함 → 전국
     */
    private boolean isNationwidePolicy(PolicyDataJpaEntity policy) {
        String regionCode = policy.getRegionCode();
        if (regionCode == null || regionCode.trim().isEmpty() || "0000".equals(regionCode.trim())) {
            return true;
        }
        return policy.getCategory() != null && policy.getCategory().contains("전국");
    }


    /**
     * Candidate → DTO 변환.
     * aiReasonMap이 비어있으면 규칙 기반 사유만 사용합니다.
     */
    private PolicyRecommendResponse.RecommendedPolicyDto toPolicyDto(
            Candidate c, Map<Long, PolicyAiPort.PolicyReason> aiReasonMap) {
        PolicyDataJpaEntity p = c.policy;
        String safeSummary = p.getContent() != null
                ? (p.getContent().length() > 100 ? p.getContent().substring(0, 100) + "..." : p.getContent())
                : "지원 내용 상세는 원문을 확인해주세요.";

        PolicyAiPort.PolicyReason aiReason = aiReasonMap.get(p.getId());
        String finalReason = (aiReason != null && aiReason.matchReason() != null)
                ? aiReason.matchReason()
                : String.join(" ", c.reasons);
        int finalScore = (aiReason != null && aiReason.matchScore() > 0)
                ? aiReason.matchScore()
                : c.score;

        return new PolicyRecommendResponse.RecommendedPolicyDto(
                p.getId(), p.getTitle(), p.getCategory(), p.getSupportAmount(),
                p.getOrganization(),
                p.getApplyEnd() != null ? p.getApplyEnd().toString() : null,
                p.getSourceUrl(), finalScore, finalReason, safeSummary
        );
    }
}
