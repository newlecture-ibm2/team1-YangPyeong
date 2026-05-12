package com.farmbalance.policy.application.service;

import com.farmbalance.policy.adapter.in.web.dto.PolicyRecommendResponse;
import com.farmbalance.policy.adapter.out.persistence.entity.PolicyDataJpaEntity;
import com.farmbalance.policy.adapter.out.persistence.repository.PolicyDataRepository;
import com.farmbalance.policy.application.port.in.RecommendPolicyUseCase;
import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort;
import com.farmbalance.policy.application.port.out.LoadFarmerProfilePort.FarmerProfileData;
import com.farmbalance.policy.application.port.out.PolicyGraphQueryPort;
import com.farmbalance.policy.application.port.out.PolicyAiPort;
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

    @Override
    public PolicyRecommendResponse recommendForUser(Long userId) {
        // 1. 농업인 프로필 로드
        FarmerProfileData profile = loadFarmerProfilePort.loadFarmerProfile(userId);
        if (profile == null) {
            // 정보 없음 (농업인이 아니거나, 농장이 아예 없음)
            return new PolicyRecommendResponse(null, List.of());
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
        class Candidate {
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

        List<Candidate> candidates = new ArrayList<>();

        for (PolicyDataJpaEntity policy : activePolicies) {
            int score = 0;
            List<String> reasons = new ArrayList<>();
            boolean exactRegion = false;

            // 1) 지역 매칭
            if (policy.getRegionCode() != null && policy.getRegionCode().equals(profile.regionCode())) {
                score += 30;
                exactRegion = true;
                reasons.add("거주 지역(" + profile.regionName() + ") 농업인을 위한 맞춤형 정책입니다.");
            } else if (policy.getRegionCode() == null || policy.getRegionCode().trim().isEmpty() || 
                       (policy.getCategory() != null && policy.getCategory().contains("전국"))) {
                score += 15;
                reasons.add("전국 어디서나 신청 가능한 공통 지원 정책입니다.");
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
                    if (containsKeyword(policy, category)) {
                        score += 15;
                        reasons.add("재배 중인 작물 분류('" + category + "')와 연관된 혜택이 있습니다.");
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

            if (score > 15) { 
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

        // 5. 상위 5개 추출
        List<Candidate> topCandidates = candidates.stream().limit(5).toList();
        List<PolicyDataJpaEntity> topPolicies = topCandidates.stream().map(c -> c.policy).toList();
        List<Long> topPolicyIds = topPolicies.stream().map(PolicyDataJpaEntity::getId).toList();

        // 6. GraphRAG 릴레이션 조회
        List<Map<String, Object>> graphRelations = policyGraphQueryPort.findRelationsForFarmerAndPolicies(userId, topPolicyIds);

        // 7. AI 추천 사유 생성을 위한 데이터 준비
        Map<String, Object> farmerProfileMap = new java.util.HashMap<>();
        farmerProfileMap.put("name", profile.name());
        farmerProfileMap.put("regionName", profile.regionName());
        farmerProfileMap.put("totalArea", totalArea);
        farmerProfileMap.put("crops", userCrops);

        List<Map<String, Object>> candidatePoliciesMap = topPolicies.stream().map(p -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("policyId", p.getId());
            map.put("title", p.getTitle());
            map.put("category", p.getCategory());
            map.put("supportAmount", p.getSupportAmount());
            return map;
        }).toList();

        // 8. AI 초개인화 사유 요청
        PolicyAiPort.AiPolicyRecommendation aiResult = policyAiPort.generatePolicyReason(userId, farmerProfileMap, graphRelations, candidatePoliciesMap);
        Map<Long, PolicyAiPort.PolicyReason> aiReasonMap = aiResult.reasons() != null ? 
            aiResult.reasons().stream().collect(java.util.stream.Collectors.toMap(PolicyAiPort.PolicyReason::policyId, r -> r, (r1, r2) -> r1)) : Map.of();

        // 9. DTO 변환
        List<PolicyRecommendResponse.RecommendedPolicyDto> topRecommendations = topCandidates.stream()
                .map(c -> {
                    PolicyDataJpaEntity p = c.policy;
                    String safeSummary = p.getContent() != null ? 
                        (p.getContent().length() > 100 ? p.getContent().substring(0, 100) + "..." : p.getContent()) 
                        : "지원 내용 상세는 원문을 확인해주세요.";
                    
                    PolicyAiPort.PolicyReason aiReason = aiReasonMap.get(p.getId());
                    String finalReason = (aiReason != null && aiReason.matchReason() != null) ? aiReason.matchReason() : String.join(" ", c.reasons);
                    int finalScore = (aiReason != null && aiReason.matchScore() > 0) ? aiReason.matchScore() : c.score;
                    
                    return new PolicyRecommendResponse.RecommendedPolicyDto(
                            p.getId(),
                            p.getTitle(),
                            p.getCategory(),
                            p.getSupportAmount(),
                            p.getOrganization(),
                            p.getApplyEnd() != null ? p.getApplyEnd().toString() : null,
                            p.getSourceUrl(),
                            finalScore,
                            finalReason,
                            safeSummary
                    );
                })
                .toList();

        return new PolicyRecommendResponse(summary, topRecommendations);
    }

    private boolean containsKeyword(PolicyDataJpaEntity policy, String keyword) {
        if (keyword == null || keyword.isBlank()) return false;
        String kw = keyword.toLowerCase();
        return (policy.getTitle() != null && policy.getTitle().toLowerCase().contains(kw)) ||
               (policy.getTarget() != null && policy.getTarget().toLowerCase().contains(kw)) ||
               (policy.getContent() != null && policy.getContent().toLowerCase().contains(kw));
    }
}
