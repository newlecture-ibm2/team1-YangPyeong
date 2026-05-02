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

    public static CultivationHistory createWeatherHistory(Long farmId, Double avgTa, Double sumRn, java.time.LocalDate date) {
        String content = String.format("[날씨] 기온: %.1f℃, 강수량: %.1fmm (%s)", 
                avgTa, sumRn, date.toString());
        
        return CultivationHistory.builder()
                .farmId(farmId)
                .historyType(HistoryType.WEATHER)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
