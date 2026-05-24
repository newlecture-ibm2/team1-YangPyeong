package com.farmbalance.farm.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmAgentSummaryResponse {
    private FarmStatusDto farmStatus;
    private List<CultivationHistoryDto> cultivationHistory;
    private WeatherContextDto weatherContext;

    @Getter
    @Builder
@NoArgsConstructor
@AllArgsConstructor
    public static class FarmStatusDto {
        private Long farmId;
        private String name;
        private Double totalArea;
        private Double availableArea;
        private List<String> activeCrops;
        private String soilType;
        private Double ph;
        private Double organicMatter;
    }

    @Getter
    @Builder
@NoArgsConstructor
@AllArgsConstructor
    public static class CultivationHistoryDto {
        private String cropName;
        private String action; // e.g., "PLANTED", "HARVESTED"
        private String date;
        private Double amount;
        private String unit;
    }

    @Getter
    @Builder
@NoArgsConstructor
@AllArgsConstructor
    public static class WeatherContextDto {
        private String currentCondition;
        private Double temperature;
        private String guideMessage;
    }
}
