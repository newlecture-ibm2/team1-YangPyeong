package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.RegisterCultivationCommand;
import com.farmbalance.farm.application.port.in.RegisterCultivationUseCase;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 재배 등록 REST Controller
 */
@RestController
@RequestMapping("/api/farms/{farmId}/cultivations")
@RequiredArgsConstructor
public class CultivationController {

    private final RegisterCultivationUseCase registerCultivationUseCase;
    private final LoadFarmUseCase loadFarmUseCase;

    /**
     * 특정 농장의 재배 등록 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CultivationRegistration>>> getCultivations(
            @PathVariable Long farmId) {
        List<CultivationRegistration> list = loadFarmUseCase.loadCultivationsByFarmId(farmId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * 기존 농장에 재배 등록 추가
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CultivationResponse>> registerCultivation(
            @PathVariable Long farmId,
            @Valid @RequestBody CultivationRequest request) {

        RegisterCultivationCommand command = RegisterCultivationCommand.builder()
                .farmId(farmId)
                .cropId(request.getCropId())
                .cultivationArea(request.getCultivationArea())
                .expectedYield(request.getExpectedYield())
                .yieldUnit(request.getYieldUnit())
                .build();

        CultivationRegistration saved = registerCultivationUseCase.registerCultivation(command);

        CultivationResponse response = new CultivationResponse(
                saved.getId(), saved.getFarmId(), saved.getCropId(),
                saved.getCultivationArea(),
                saved.getFarmerEstimatedYield(), saved.getYieldUnit()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // ── Request / Response DTO (내부 클래스) ──

    @Getter
    @NoArgsConstructor
    static class CultivationRequest {
        @NotNull(message = "작물 ID는 필수입니다.")
        private Long cropId;
        private Double cultivationArea;    // 재배 면적 (㎡)
        private Double expectedYield;     // 예상 수확량
        private String yieldUnit;         // g | kg | ton
    }

    record CultivationResponse(
            Long id, Long farmId, Long cropId,
            Double cultivationArea,
            Double farmerEstimatedYield, String yieldUnit
    ) {}
}
