package com.farmbalance.history.application.port.in;

import com.farmbalance.history.domain.HistoryType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecordHistoryCommand {
    private final Long farmId;
    private final HistoryType historyType;
    private final String content;
}
