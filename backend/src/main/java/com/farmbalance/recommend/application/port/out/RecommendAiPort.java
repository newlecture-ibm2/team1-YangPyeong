package com.farmbalance.recommend.application.port.out;

import org.springframework.web.multipart.MultipartFile;

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
     * 작물 병해충 이미지 진단
     */
    String diagnoseImage(MultipartFile image);

    /**
     * 가중치 튜닝
     */
    double[] tuneWeights(String farmDetails);
}
