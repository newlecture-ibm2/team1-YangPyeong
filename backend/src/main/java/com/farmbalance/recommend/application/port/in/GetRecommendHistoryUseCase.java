package com.farmbalance.recommend.application.port.in;

import com.farmbalance.recommend.domain.RecommendResult;
import java.util.List;

public interface GetRecommendHistoryUseCase {
    List<RecommendResult> getHistory(Long userId, Long farmId);

    /**
     * 최근 추천 이력 1건. 없으면 {@code null} (정상 케이스 — 아직 AI 추천을 실행하지 않은 농장).
     */
    RecommendResult getLatestHistory(Long userId, Long farmId);
}
