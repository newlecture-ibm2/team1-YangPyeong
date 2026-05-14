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
import com.farmbalance.farm.application.port.in.AnalyzeFarmDocumentUseCase;
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
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.application.port.out.LoadFarmPort;

@RestController
@RequestMapping({"/api/farms", "/api/farm"})
@RequiredArgsConstructor
public class FarmController {

    private final RegisterFarmUseCase registerFarmUseCase;
    private final LoadFarmUseCase loadFarmUseCase;
    private final UpdateFarmUseCase updateFarmUseCase;
    private final DeleteFarmUseCase deleteFarmUseCase;

    private final AnalyzeFarmDocumentUseCase analyzeFarmDocumentUseCase;

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FarmRegisterResponse>> registerFarm(
            @AuthenticationPrincipal Long userId,
            @RequestPart("request") @Valid FarmRegisterRequest request,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        
        System.out.println("[DEBUG] 농장 등록 요청 시작");
        System.out.println("[DEBUG] userId: " + userId);
        
        // TODO: 운영 전 제거 — 개발 환경에서 인증 없이 테스트하기 위한 임시 코드
        if (userId == null) {
            userId = 9001L;
        }

        // 1. 파일이 있으면 OCR 분석 수행
        com.farmbalance.farm.domain.FarmDocumentData documentData = null;
        if (file != null && !file.isEmpty()) {
            documentData = analyzeFarmDocumentUseCase.analyzeDocument(file);
            
            // AI 서버가 반려한 경우 (유효하지 않은 문서)
            if (documentData != null && documentData.getIsValid() != null && !documentData.getIsValid()) {
                throw new IllegalArgumentException("유효하지 않은 문서입니다: " + documentData.getErrorMessage());
            }
        }

        // DTO -> Command 매핑
        List<RegisterFarmCommand.CultivationDetail> cultivationDetails = null;
        if (request.getCultivations() != null && !request.getCultivations().isEmpty()) {
            cultivationDetails = request.getCultivations().stream()
                    .map(c -> RegisterFarmCommand.CultivationDetail.builder()
                            .cropId(c.getCropId())
                            .area(c.getArea())
                            .expectedYield(c.getExpectedYield())
                            .build())
                    .collect(java.util.stream.Collectors.toList());
        }

        RegisterFarmCommand command = RegisterFarmCommand.builder()
                .userId(userId)
                .name(request.getName())
                .address(request.getAddress())
                .area(request.getArea())
                .cropIds(request.getCropIds())
                .bjdCode(request.getBjdCode())
                .isMountain(request.isMountain())
                .mainNo(request.getMainNo())
                .subNo(request.getSubNo())
                .documents(request.getDocuments() != null ? 
                        request.getDocuments().stream().map(com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto::toDomain).collect(java.util.stream.Collectors.toList()) : null)
                .documentData(documentData)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .soilType(request.getSoilType())
                .ph(request.getPh())
                .organicMatter(request.getOrganicMatter())
                .cultivations(cultivationDetails)
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
                        .cropNames(farm.getCropNames())
                        .certificationStatus(farm.getCertificationStatus() != null ? farm.getCertificationStatus().name() : "PENDING")
                        .rejectReason(farm.getRejectReason())
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
                .cropNames(farm.getCropNames())
                .cropIds(farm.getCropIds())
                .pnuCode(farm.getPnuCode())
                .bjdCode(farm.getBjdCode())
                .documents(farm.getDocuments() != null ?
                        farm.getDocuments().stream().map(com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto::from).collect(java.util.stream.Collectors.toList()) : null)
                .soilType(farm.getSoilType())
                .ph(farm.getPh())
                .organicMatter(farm.getOrganicMatter())
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
                .cropIds(request.getCropIds())
                .bjdCode(request.getBjdCode())
                .isMountain(request.isMountain())
                .mainNo(request.getMainNo())
                .subNo(request.getSubNo())
                .documents(request.getDocuments() != null ? 
                        request.getDocuments().stream().map(com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto::toDomain).collect(java.util.stream.Collectors.toList()) : null)
                .soilType(request.getSoilType())
                .ph(request.getPh())
                .organicMatter(request.getOrganicMatter())
                .build();

        Farm updatedFarm = updateFarmUseCase.updateFarm(command);

        FarmDetailResponse responseData = FarmDetailResponse.builder()
                .id(updatedFarm.getId())
                .name(updatedFarm.getName())
                .address(updatedFarm.getAddress())
                .area(updatedFarm.getArea())
                .cropNames(updatedFarm.getCropNames())
                .cropIds(updatedFarm.getCropIds())
                .pnuCode(updatedFarm.getPnuCode())
                .bjdCode(updatedFarm.getBjdCode())
                .documents(updatedFarm.getDocuments() != null ?
                        updatedFarm.getDocuments().stream().map(com.farmbalance.farm.adapter.in.web.dto.FarmDocumentDto::from).collect(java.util.stream.Collectors.toList()) : null)
                .soilType(updatedFarm.getSoilType())
                .ph(updatedFarm.getPh())
                .organicMatter(updatedFarm.getOrganicMatter())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(responseData));
    }

    @DeleteMapping("/{farmId}")
    public ResponseEntity<ApiResponse<Void>> deleteFarm(@PathVariable Long farmId) {
        deleteFarmUseCase.deleteFarm(farmId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
