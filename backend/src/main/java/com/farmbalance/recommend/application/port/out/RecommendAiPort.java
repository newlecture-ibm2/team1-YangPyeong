package com.farmbalance.recommend.application.port.out;

import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public interface RecommendAiPort {
    /**
     * 작물 추천 사유 생성 (레거시 — 모드·유형 미지정 시 NEW_RECOMMEND)
     */
    default String generateReason(String farmDetails, String cropName, String cropCategory) {
        return generateReason(new RecommendReasonCommand(
                farmDetails, cropName, cropCategory,
                com.farmbalance.recommend.domain.RecommendMode.PLAN,
                com.farmbalance.recommend.domain.AdviceType.NEW_RECOMMEND,
                false,
                null
        ));
    }

    /**
     * 모드·조언 유형에 맞는 AI 사유 생성
     */
    String generateReason(RecommendReasonCommand command);

    /**
     * 여러 작물의 추천 사유를 한 번의 AI 호출로 일괄 생성합니다.
     * 기본 구현은 개별 호출 폴백입니다.
     *
     * @param farmDetails 농장 상세 정보
     * @param mode        추천 모드
     * @param commands    개별 작물별 사유 생성 커맨드 목록
     * @return 작물명 → AI 사유 맵
     */
    default Map<String, String> generateBatchReasons(
            String farmDetails,
            com.farmbalance.recommend.domain.RecommendMode mode,
            List<RecommendReasonCommand> commands
    ) {
        Map<String, String> results = new LinkedHashMap<>();
        for (RecommendReasonCommand cmd : commands) {
            try {
                results.put(cmd.cropName(), generateReason(cmd));
            } catch (Exception e) {
                results.put(cmd.cropName(), "현재 농장 데이터를 바탕으로 분석한 결과입니다.");
            }
        }
        return results;
    }

    /**
     * 작물 병해충 이미지 진단
     */
    String diagnoseImage(MultipartFile image);

    /**
     * 가중치 튜닝
     */
    double[] tuneWeights(String farmDetails);
}

