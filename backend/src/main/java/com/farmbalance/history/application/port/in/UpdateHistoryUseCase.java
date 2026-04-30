package com.farmbalance.history.application.port.in;

import com.farmbalance.history.domain.HistoryType;

public interface UpdateHistoryUseCase {
    void updateHistory(Long historyId, String content, HistoryType historyType);
}
