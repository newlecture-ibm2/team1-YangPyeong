package com.farmbalance.recommend.application.port.in;

import com.farmbalance.recommend.domain.RecommendResult;

import java.util.List;

/**
 * AI 작물 추천 실행 유스케이스
 */
public interface RecommendCropUseCase {

    /**
     * 빠른 추천 — 점수·순위만 계산 (LLM 없음).
     */
    RecommendResult recommend(Long userId, Long farmId);

    /**
     * 선택 작물에 AI 코칭(aiReason) 생성 — 사용자 요청 시에만.
     */
    RecommendResult requestAiCoaching(Long userId, Long farmId, List<Long> cropIds);
}
