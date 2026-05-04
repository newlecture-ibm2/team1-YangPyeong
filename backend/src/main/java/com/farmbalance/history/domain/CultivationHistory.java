package com.farmbalance.history.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CultivationHistory {
    private Long id;
    private Long farmId;
    private Long cultivationRegistrationId;
    private java.time.LocalDate recordDate;
    private HistoryType activityType;
    private String activityContent;
    private Double avgTemp;
    private Double totalRain;
    private LocalDateTime createdAt;

    public static CultivationHistory createWeatherHistory(Long farmId, Double avgTa, Double sumRn, java.time.LocalDate date) {
        String content = String.format("[날씨] 기온: %.1f℃, 강수량: %.1fmm", avgTa, sumRn);
        
        return CultivationHistory.builder()
                .farmId(farmId)
                .recordDate(date)
                .activityType(HistoryType.WEATHER)
                .activityContent(content)
                .avgTemp(avgTa)
                .totalRain(sumRn)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
