package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.adapter.out.external.soil.SoilApiClient;
import com.farmbalance.farm.adapter.out.external.soil.dto.SoilV3Response;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "토양 API 테스트", description = "토양 데이터 연동 및 외부 API 확인용")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/test/soil")
public class TestSoilController {

    private final SoilApiClient soilApiClient;

    @Operation(summary = "토양 물리성 데이터 조회 테스트", description = "PNU 코드를 기반으로 흙토람 V3 API를 직접 호출합니다.")
    @GetMapping("/{pnuCode}")
    public SoilV3Response testSoilApi(
            @Parameter(description = "PNU 코드 19자리 (예: 4183031023101160001)", example = "4183031023101160001")
            @PathVariable String pnuCode) {
        return soilApiClient.getSoilCharacteristics(pnuCode);
    }
}
