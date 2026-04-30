package com.farmbalance.history.adapter.in.web.dto;

import com.farmbalance.history.domain.HistoryType;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class HistoryResponse {
    private Long id;
    private Long farmId;
    private HistoryType historyType;
    private String content;
    private LocalDateTime createdAt;
}
