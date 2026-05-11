package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.adapter.in.web.dto.FarmAgentSummaryResponse;
import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.LoadHarvestUseCase;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.WeatherRecordPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.HarvestRecord;
import com.farmbalance.farm.domain.ShortTermForecast;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/farms")
@RequiredArgsConstructor
public class InternalFarmController {

    private final LoadFarmUseCase loadFarmUseCase;
    private final LoadFarmPort loadFarmPort;
    private final LoadHarvestUseCase loadHarvestUseCase;
    private final WeatherRecordPort weatherRecordPort;

    @GetMapping("/{farmId}/agent-summary")
    public ResponseEntity<ApiResponse<FarmAgentSummaryResponse>> getAgentSummary(
            @PathVariable Long farmId,
            @RequestHeader(value = "X-AI-Internal-Key", required = false) String apiKey) {

        // TODO: 환경 변수에서 가져오도록 변경
        if (!"farm-balance-ai-secret-key".equals(apiKey)) {
            return ResponseEntity.status(403).build();
        }

        // 1. 농장 상태 조회
        Farm farm = loadFarmUseCase.loadFarmDetail(farmId);
        Double usedArea = loadFarmPort.sumActiveAreaByFarmId(farmId);
        if (usedArea == null) usedArea = 0.0;

        List<CultivationRegistration> cultivations = loadFarmUseCase.loadCultivationsByFarmId(farmId);
        List<String> activeCrops = cultivations.stream()
                .filter(c -> !c.isCompleted())
                .map(CultivationRegistration::getCropName)
                .distinct()
                .collect(Collectors.toList());

        FarmAgentSummaryResponse.FarmStatusDto statusDto = FarmAgentSummaryResponse.FarmStatusDto.builder()
                .farmId(farm.getId())
                .name(farm.getName())
                .totalArea(farm.getArea())
                .availableArea(Math.max(0, farm.getArea() - usedArea))
                .activeCrops(activeCrops)
                .build();

        // 2. 재배/수확 이력 조회 (최근 10건)
        List<FarmAgentSummaryResponse.CultivationHistoryDto> historyList = new ArrayList<>();
        for (CultivationRegistration reg : cultivations) {
            List<HarvestRecord> records = loadHarvestUseCase.loadHarvestRecords(reg.getId());
            for (HarvestRecord record : records) {
                historyList.add(FarmAgentSummaryResponse.CultivationHistoryDto.builder()
                        .cropName(reg.getCropName())
                        .action("HARVESTED")
                        .date(record.getHarvestDate().toString())
                        .amount(record.getYieldAmount())
                        .unit(record.getYieldUnit())
                        .build());
            }
            // 심은 정보 추가
            if (reg.getCreatedAt() != null) {
                historyList.add(FarmAgentSummaryResponse.CultivationHistoryDto.builder()
                        .cropName(reg.getCropName())
                        .action("PLANTED")
                        .date(reg.getCreatedAt().toLocalDate().toString())
                        .amount(reg.getCultivationArea())
                        .unit("㎡")
                        .build());
            }
        }
        
        List<FarmAgentSummaryResponse.CultivationHistoryDto> sortedHistory = historyList.stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(10)
                .collect(Collectors.toList());

        // 3. 기상 정보 조회
        ShortTermForecast forecast = weatherRecordPort.fetchShortTermForecast(69, 125); // 양평 기본 좌표
        String skyStatus = "맑음";
        if (forecast.getSky() != null) {
            if (forecast.getSky() == 3) skyStatus = "구름많음";
            else if (forecast.getSky() == 4) skyStatus = "흐림";
        }

        FarmAgentSummaryResponse.WeatherContextDto weatherDto = FarmAgentSummaryResponse.WeatherContextDto.builder()
                .currentCondition(skyStatus)
                .temperature(forecast.getTmp())
                .guideMessage(forecast.getTmp() != null && forecast.getTmp() > 25 ? "기온이 높습니다. 관수에 유의하세요." : "재배하기 적당한 날씨입니다.")
                .build();

        return ResponseEntity.ok(ApiResponse.ok(
                FarmAgentSummaryResponse.builder()
                        .farmStatus(statusDto)
                        .cultivationHistory(sortedHistory)
                        .weatherContext(weatherDto)
                        .build()
        ));
    }
}
