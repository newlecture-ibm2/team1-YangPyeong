package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.adapter.out.external.soil.SoilApiClient;
import com.farmbalance.farm.adapter.out.external.soil.dto.SoilV2Response;
import com.farmbalance.farm.adapter.out.external.soil.dto.SoilV3Response;
import com.farmbalance.farm.adapter.out.external.soil.dto.SoilBjdResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "토양 정보", description = "흙토람 토양 물리성 및 화학성 데이터 조회 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/soil")
public class SoilController {

    private final SoilApiClient soilApiClient;

    @Operation(summary = "토양 물리성 정보 조회", description = "PNU 코드를 기반으로 흙토람 V3 API(토성, 배수 등)를 호출합니다.")
    @GetMapping("/physical/{pnuCode}")
    public SoilV3Response getPhysicalSoilInfo(
            @Parameter(description = "PNU 코드 19자리", example = "4183031023101160001")
            @PathVariable String pnuCode) {
        return soilApiClient.getSoilCharacteristics(pnuCode);
    }

    @Operation(summary = "토양 화학성 정보 조회", description = "PNU 코드를 기반으로 흙토람 V2 API(pH, 유기물 등)를 호출합니다.")
    @GetMapping("/chemical/{pnuCode}")
    public SoilV2Response getChemicalSoilInfo(
            @Parameter(description = "PNU 코드 19자리", example = "4183031023101160001")
            @PathVariable String pnuCode) {
        return soilApiClient.getSoilChemicalCharacteristics(pnuCode);
    }

    @Operation(summary = "법정동별 토양 통계 정보 조회", description = "법정동 코드(10자리)를 기반으로 해당 지역의 토양 화학성 통계 데이터를 조회합니다.")
    @GetMapping("/statistics/{bjdCode}")
    public SoilBjdResponse getBjdSoilInfo(
            @Parameter(description = "법정동 코드 10자리", example = "4183031023")
            @PathVariable String bjdCode) {
        return soilApiClient.getSoilBjdStatistics(bjdCode);
    }
}
