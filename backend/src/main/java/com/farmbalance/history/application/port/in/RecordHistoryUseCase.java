package com.farmbalance.history.application.port.in;

public interface RecordHistoryUseCase {
    void recordHistory(RecordHistoryCommand command);
}
