package com.farmbalance.history.application.port.out;

import com.farmbalance.history.domain.CultivationHistory;
import java.util.List;

public interface LoadHistoryPort {
    List<CultivationHistory> loadHistoriesByFarmId(Long farmId);
    java.util.Optional<CultivationHistory> loadHistoryById(Long historyId);
}
