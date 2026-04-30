package com.farmbalance.history.application.port.out;

import com.farmbalance.history.domain.CultivationHistory;

public interface SaveHistoryPort {
    void saveHistory(CultivationHistory history);
}
