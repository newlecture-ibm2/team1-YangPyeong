package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.adapter.in.web.dto.CultivationResponse;
import com.farmbalance.farm.adapter.in.web.dto.RegisterCultivationRequest;
import com.farmbalance.farm.application.port.in.LoadCultivationUseCase;
import com.farmbalance.farm.application.port.in.RegisterCultivationCommand;
import com.farmbalance.farm.application.port.in.RegisterCultivationUseCase;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 재배 등록 및 조회 컨트롤러 (Driving Adapter)
 */
@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
public class CultivationController {

    private final RegisterCultivationUseCase registerUseCase;
    private final LoadCultivationUseCase loadUseCase;

    /**
     * 특정 농장에 재배 계획 등록
     */
    @PostMapping("/{farmId}/cultivations")
    public ApiResponse<CultivationResponse> registerCultivation(
            @PathVariable Long farmId,
            @Valid @RequestBody RegisterCultivationRequest request) {

        RegisterCultivationCommand command = RegisterCultivationCommand.builder()
                .farmId(farmId)
                .cropId(request.getCropId())
                .cultivationType(request.getCultivationType())
                .cultivationArea(request.getCultivationArea())
                .farmerEstimatedYield(request.getFarmerEstimatedYield())
                .yieldUnit(request.getYieldUnit())
                .build();

        CultivationRegistration result = registerUseCase.registerCultivation(command);
        return ApiResponse.ok(CultivationResponse.from(result));
    }

    /**
     * 특정 농장의 전체 재배 목록 조회
     */
    @GetMapping("/{farmId}/cultivations")
    public ApiResponse<List<CultivationResponse>> getCultivations(@PathVariable Long farmId) {
        List<CultivationRegistration> results = loadUseCase.getCultivationsByFarmId(farmId);
        List<CultivationResponse> response = results.stream()
                .map(CultivationResponse::from)
                .collect(Collectors.toList());
        return ApiResponse.ok(response);
    }
}
