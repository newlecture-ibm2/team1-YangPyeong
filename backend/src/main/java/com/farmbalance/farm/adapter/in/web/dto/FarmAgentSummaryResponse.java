package com.farmbalance.farm.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class FarmAgentSummaryResponse {
    private FarmStatusDto farmStatus;
    private List<CultivationHistoryDto> cultivationHistory;
    private WeatherContextDto weatherContext;

    @Getter
    @Builder
    public static class FarmStatusDto {
        private Long farmId;
        private String name;
        private Double totalArea;
        private Double availableArea;
        private List<String> activeCrops;
    }

    @Getter
    @Builder
    public static class CultivationHistoryDto {
        private String cropName;
        private String action; // e.g., "PLANTED", "HARVESTED"
        private String date;
        private Double amount;
        private String unit;
    }

    @Getter
    @Builder
    public static class WeatherContextDto {
        private String currentCondition;
        private Double temperature;
        private String guideMessage;
    }
}
