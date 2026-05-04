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
    private Long cultivationRegistrationId;
    private java.time.LocalDate recordDate;
    private HistoryType activityType;
    private String activityContent;
    private Double avgTemp;
    private Double totalRain;
    private LocalDateTime createdAt;
}
