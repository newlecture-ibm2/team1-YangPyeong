package com.farmbalance.history.application.port.in;

import com.farmbalance.history.domain.CultivationHistory;
import java.util.List;

public interface LoadHistoryUseCase {
    List<CultivationHistory> getHistoriesByFarmId(Long farmId);
}
