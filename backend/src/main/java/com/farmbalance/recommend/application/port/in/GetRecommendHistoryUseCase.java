package com.farmbalance.recommend.application.port.in;

import com.farmbalance.recommend.domain.RecommendResult;
import java.util.List;

public interface GetRecommendHistoryUseCase {
    List<RecommendResult> getHistory(Long userId, Long farmId);
    RecommendResult getLatestHistory(Long userId, Long farmId);
}
