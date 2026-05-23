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
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.ai-internal-secret-key:farm-balance-ai-secret-key}")
    private String aiInternalSecretKey;

    /**
     * AI 내부 API 키 검증
     */
    private boolean isValidApiKey(String apiKey) {
        return aiInternalSecretKey.equals(apiKey);
    }

    /**
     * userId 기반 농장 조회 — AI agent가 farmId를 몰라도 사용자 농장 정보를 조회 가능.
     * LLM이 farmId를 임의 지정하는 IDOR 취약점을 방지합니다.
     */
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<ApiResponse<FarmAgentSummaryResponse>> getAgentSummaryByUser(
            @PathVariable Long userId,
            @RequestHeader(value = "X-AI-Internal-Key", required = false) String apiKey) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(403).body(ApiResponse.fail("E-FM-AUTH-001", "AI 내부 API 키가 유효하지 않습니다."));
        }

        // userId로 농장 목록 조회 → 첫 번째 농장의 summary 반환
        List<Farm> farms = loadFarmPort.loadFarmsByUserId(userId);
        if (farms.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.fail("E-FM-NOT-FOUND", "등록된 농장이 없습니다."));
        }

        return buildAgentSummary(farms.get(0).getId());
    }

    /**
     * farmId 기반 농장 조회 — 소유권 검증은 AI Key + X-AI-User-Id 헤더로 수행.
     */
    @GetMapping("/{farmId}/agent-summary")
    public ResponseEntity<ApiResponse<FarmAgentSummaryResponse>> getAgentSummary(
            @PathVariable Long farmId,
            @RequestHeader(value = "X-AI-Internal-Key", required = false) String apiKey,
            @RequestHeader(value = "X-AI-User-Id", required = false) Long requestUserId) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(403).body(ApiResponse.fail("E-FM-AUTH-001", "AI 내부 API 키가 유효하지 않습니다."));
        }

        // 소유권 검증: X-AI-User-Id 헤더가 있으면 해당 사용자의 농장인지 확인 (0은 테스트 익명 사용자)
        if (requestUserId != null && requestUserId > 0) {
            Farm farm = loadFarmUseCase.loadFarmDetail(farmId);
            if (!requestUserId.equals(farm.getUserId())) {
                return ResponseEntity.status(403).body(
                        ApiResponse.fail("E-FM-AUTH-002", "해당 농장에 대한 접근 권한이 없습니다."));
            }
        }

        return buildAgentSummary(farmId);
    }

    /**
     * 농장 summary 빌드 로직 (공통)
     */
    private ResponseEntity<ApiResponse<FarmAgentSummaryResponse>> buildAgentSummary(Long farmId) {
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
                .soilType(farm.getSoilType())
                .ph(farm.getPh())
                .organicMatter(farm.getOrganicMatter())
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
