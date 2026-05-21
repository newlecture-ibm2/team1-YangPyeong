package com.farmbalance.history.adapter.in.web.dto;

import com.farmbalance.history.domain.HistoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
