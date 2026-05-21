package com.farmbalance.recommend.application.port.out;

import com.farmbalance.recommend.domain.RecommendResult;

public interface SaveRecommendHistoryPort {
    void save(RecommendResult result);

    /** 최신 추천 이력 item에 AI 코칭 결과만 병합 (코칭 재요청 시 이력 중복 방지) */
    void updateLatestCoaching(Long farmId, RecommendResult result);
}
