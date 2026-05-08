package com.farmbalance.recommend.application.port.out;

import com.farmbalance.recommend.domain.RecommendResult;

public interface SaveRecommendHistoryPort {
    void save(RecommendResult result);
}
