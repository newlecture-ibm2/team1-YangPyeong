package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.application.port.in.DeleteFarmUseCase;
import com.farmbalance.farm.adapter.in.web.dto.FarmDetailResponse;
import com.farmbalance.farm.adapter.in.web.dto.FarmListResponse;
import com.farmbalance.farm.adapter.in.web.dto.FarmRegisterRequest;
import com.farmbalance.farm.adapter.in.web.dto.FarmRegisterResponse;
import com.farmbalance.farm.application.port.in.UpdateFarmUseCase;
import com.farmbalance.farm.application.port.in.UpdateFarmCommand;
import com.farmbalance.farm.adapter.in.web.dto.FarmUpdateRequest;
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
    private final UpdateFarmUseCase updateFarmUseCase;
    private final DeleteFarmUseCase deleteFarmUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<FarmRegisterResponse>> registerFarm(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody FarmRegisterRequest request) {
        
        System.out.println("[DEBUG] 농장 등록 요청 시작");
        System.out.println("[DEBUG] userId: " + userId);
        System.out.println("[DEBUG] name: " + request.getName());
        System.out.println("[DEBUG] address: " + request.getAddress());
        System.out.println("[DEBUG] bjdCode: " + request.getBjdCode());
        System.out.println("[DEBUG] mainNo: " + request.getMainNo());
        System.out.println("[DEBUG] subNo: " + request.getSubNo());
        System.out.println("[DEBUG] area: " + request.getArea());
        
        // TODO: 운영 전 제거 — 개발 환경에서 인증 없이 테스트하기 위한 임시 코드
        if (userId == null) {
            userId = 9001L;
        }

        // DTO -> Command 매핑
        RegisterFarmCommand command = RegisterFarmCommand.builder()
                .userId(userId)
                .name(request.getName())
                .address(request.getAddress())
                .area(request.getArea())
                .cropTypes(request.getCropTypes())
                .bjdCode(request.getBjdCode())
                .isMountain(request.isMountain())
                .mainNo(request.getMainNo())
                .subNo(request.getSubNo())
                .registrationNumber(request.getRegistrationNumber())
                .documentUrl(request.getDocumentUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
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

        // TODO: 운영 전 제거 — 개발 환경에서 인증 없이 테스트하기 위한 임시 코드
        if (userId == null) {
            userId = 9001L;
        }

        List<Farm> farms = loadFarmUseCase.loadFarmsByUserId(userId);
        
        List<FarmListResponse> responseData = farms.stream()
                .map(farm -> FarmListResponse.builder()
                        .id(farm.getId())
                        .name(farm.getName())
                        .address(farm.getAddress())
                        .area(farm.getArea())
                        .cropTypes(farm.getCropTypes())
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
                .cropTypes(farm.getCropTypes())
                .pnuCode(farm.getPnuCode())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(responseData));
    }

    @PatchMapping("/{farmId}")
    public ResponseEntity<ApiResponse<FarmDetailResponse>> updateFarm(
            @PathVariable Long farmId,
            @Valid @RequestBody FarmUpdateRequest request) {
        
        UpdateFarmCommand command = UpdateFarmCommand.builder()
                .farmId(farmId)
                .name(request.getName())
                .address(request.getAddress())
                .area(request.getArea())
                .cropTypes(request.getCropTypes())
                .bjdCode(request.getBjdCode())
                .isMountain(request.isMountain())
                .mainNo(request.getMainNo())
                .subNo(request.getSubNo())
                .registrationNumber(request.getRegistrationNumber())
                .documentUrl(request.getDocumentUrl())
                .build();

        Farm updatedFarm = updateFarmUseCase.updateFarm(command);

        FarmDetailResponse responseData = FarmDetailResponse.builder()
                .id(updatedFarm.getId())
                .name(updatedFarm.getName())
                .address(updatedFarm.getAddress())
                .area(updatedFarm.getArea())
                .cropTypes(updatedFarm.getCropTypes())
                .pnuCode(updatedFarm.getPnuCode())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(responseData));
    }

    @DeleteMapping("/{farmId}")
    public ResponseEntity<ApiResponse<Void>> deleteFarm(@PathVariable Long farmId) {
        deleteFarmUseCase.deleteFarm(farmId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
