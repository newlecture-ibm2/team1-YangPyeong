package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.adapter.in.web.dto.FarmDetailResponse;
import com.farmbalance.farm.adapter.in.web.dto.FarmListResponse;
import com.farmbalance.farm.adapter.in.web.dto.FarmRegisterRequest;
import com.farmbalance.farm.adapter.in.web.dto.FarmRegisterResponse;
import com.farmbalance.farm.application.port.in.LoadFarmUseCase;
import com.farmbalance.farm.application.port.in.RegisterFarmCommand;
import com.farmbalance.farm.application.port.in.RegisterFarmUseCase;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
public class FarmController {

    private final RegisterFarmUseCase registerFarmUseCase;
    private final LoadFarmUseCase loadFarmUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<FarmRegisterResponse>> registerFarm(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody FarmRegisterRequest request) {
        
        // DTO -> Command 매핑
        RegisterFarmCommand command = RegisterFarmCommand.builder()
                .userId(userId)
                .name(request.getName())
                .address(request.getAddress())
                .area(request.getArea())
                .cropType(request.getCropType())
                .bjdCode(request.getBjdCode())
                .isMountain(request.isMountain())
                .mainNo(request.getMainNo())
                .subNo(request.getSubNo())
                .build();

        // UseCase 호출 (비즈니스 로직)
        Farm registeredFarm = registerFarmUseCase.registerFarm(command);

        // 결과 매핑
        FarmRegisterResponse responseData = FarmRegisterResponse.builder()
                .id(registeredFarm.getId())
                .pnuCode(registeredFarm.getPnuCode())
                .build();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(responseData));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FarmListResponse>>> getMyFarms(
            @AuthenticationPrincipal Long userId) {

        List<Farm> farms = loadFarmUseCase.loadFarmsByUserId(userId);
        
        List<FarmListResponse> responseData = farms.stream()
                .map(farm -> FarmListResponse.builder()
                        .id(farm.getId())
                        .name(farm.getName())
                        .address(farm.getAddress())
                        .cropType(farm.getCropType())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(responseData));
    }

    @GetMapping("/{farmId}")
    public ResponseEntity<ApiResponse<FarmDetailResponse>> getFarmDetail(
            @PathVariable Long farmId) {

        Farm farm = loadFarmUseCase.loadFarmDetail(farmId);
        
        FarmDetailResponse responseData = FarmDetailResponse.builder()
                .id(farm.getId())
                .name(farm.getName())
                .address(farm.getAddress())
                .area(farm.getArea())
                .cropType(farm.getCropType())
                .pnuCode(farm.getPnuCode())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(responseData));
    }
}
