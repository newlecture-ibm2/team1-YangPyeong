package com.farmbalance.history.application.port.out;

import java.util.List;

import com.farmbalance.history.domain.CultivationHistory;

public interface SaveHistoryPort {
    void saveHistory(CultivationHistory history);

    void saveAllHistories(List<CultivationHistory> histories);
}
