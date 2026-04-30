package com.farmbalance.history.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CultivationHistory {
    private Long id;
    private Long farmId;
    private HistoryType historyType;
    private String content;
    private LocalDateTime createdAt;
}
