package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.application.port.in.*;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 재배 등록 및 관리 REST Controller
 */
@RestController
@RequestMapping("/api/farms/{farmId}/cultivations")
@RequiredArgsConstructor
public class CultivationController {

    private final RegisterCultivationUseCase registerCultivationUseCase;
    private final ModifyCultivationUseCase modifyCultivationUseCase;
    private final DeleteCultivationUseCase deleteCultivationUseCase;
    private final LoadCultivationUseCase loadCultivationUseCase;

    /**
     * 특정 농장의 재배 등록 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CultivationResponse>>> getCultivations(@PathVariable Long farmId) {
        List<CultivationRegistration> results = loadCultivationUseCase.getCultivationsByFarmId(farmId);
        List<CultivationResponse> response = results.stream()
                .map(CultivationResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(response));
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
                .alreadyPlanted(request.getAlreadyPlanted())
                .sowingDate(request.getSowingDate())
                .build();

        CultivationRegistration saved = registerCultivationUseCase.registerCultivation(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(CultivationResponse.from(saved)));
    }

    /**
     * 재배 등록 수정 (FRM-011)
     */
    @PatchMapping("/{cultivationId}")
    public ResponseEntity<ApiResponse<Void>> modifyCultivation(
            @PathVariable Long farmId,
            @PathVariable Long cultivationId,
            @Valid @RequestBody ModifyCultivationRequest request) {

        ModifyCultivationCommand command = ModifyCultivationCommand.builder()
                .id(cultivationId)
                .area(request.getArea())
                .yield(request.getYield())
                .unit(request.getUnit())
                .build();

        modifyCultivationUseCase.modify(command);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * 재배 등록 삭제 (소프트 삭제)
     */
    @DeleteMapping("/{cultivationId}")
    public ResponseEntity<ApiResponse<Void>> deleteCultivation(
            @PathVariable Long farmId,
            @PathVariable Long cultivationId) {

        deleteCultivationUseCase.deleteCultivation(cultivationId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Request / Response DTO (내부 클래스) ──

    @Getter
    @NoArgsConstructor
    static class CultivationRequest {
        private Long cropId;
        private Double cultivationArea;    // 재배 면적 (㎡)
        private Double expectedYield;      // 예상 수확량
        private String yieldUnit;          // g | kg | ton
        /** true: 이미 파종·재배 중 */
        private Boolean alreadyPlanted;
        private java.time.LocalDate sowingDate;
    }

    @Getter
    @NoArgsConstructor
    static class ModifyCultivationRequest {
        private Double area;
        private Double yield;
        private String unit;
    }

    @Getter
    @RequiredArgsConstructor
    static class CultivationResponse {
        private final Long id;
        private final Long farmId;
        private final Long cropId;
        private final String cropName;
        private final Double cultivationArea;
        private final Double farmerEstimatedYield;
        private final String yieldUnit;

        public static CultivationResponse from(CultivationRegistration domain) {
            return new CultivationResponse(
                    domain.getId(),
                    domain.getFarmId(),
                    domain.getCropId(),
                    domain.getCropName(),
                    domain.getCultivationArea(),
                    domain.getFarmerEstimatedYield(),
                    domain.getYieldUnit()
            );
        }
    }
}
