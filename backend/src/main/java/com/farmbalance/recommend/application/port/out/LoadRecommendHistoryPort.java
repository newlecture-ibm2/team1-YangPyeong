package com.farmbalance.recommend.application.port.out;

import com.farmbalance.recommend.domain.RecommendResult;
import java.util.List;
import java.util.Optional;

public interface LoadRecommendHistoryPort {
    List<RecommendResult> loadByFarmId(Long farmId);
    Optional<RecommendResult> loadLatestByFarmId(Long farmId);
}
