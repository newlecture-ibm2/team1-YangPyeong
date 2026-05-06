package com.farmbalance.farm.adapter.in.web;

import com.farmbalance.farm.adapter.in.web.dto.HarvestRecordRequest;
import com.farmbalance.farm.adapter.in.web.dto.HarvestRecordResponse;
import com.farmbalance.farm.application.port.in.LoadHarvestUseCase;
import com.farmbalance.farm.application.port.in.RecordHarvestCommand;
import com.farmbalance.farm.application.port.in.RecordHarvestUseCase;
import com.farmbalance.farm.domain.HarvestRecord;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 수확 이력 REST Controller
 */
@RestController
@RequestMapping("/api/harvest-records")
@RequiredArgsConstructor
public class HarvestRecordController {

    private final RecordHarvestUseCase recordHarvestUseCase;
    private final LoadHarvestUseCase loadHarvestUseCase;

    /**
     * 수확 이력 기록
     */
    @PostMapping
    public ResponseEntity<ApiResponse<HarvestRecordResponse>> recordHarvest(
            @Valid @RequestBody HarvestRecordRequest request) {

        RecordHarvestCommand command = RecordHarvestCommand.builder()
                .cultivationRegistrationId(request.getCultivationRegistrationId())
                .harvestDate(request.getHarvestDate())
                .yieldAmount(request.getYieldAmount())
                .yieldUnit(request.getYieldUnit())
                .grade(request.getGrade())
                .toShop(request.getToShop())
                .build();

        HarvestRecord saved = recordHarvestUseCase.recordHarvest(command);

        HarvestRecordResponse response = mapToResponse(saved);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    /**
     * 재배 등록별 수확 이력 조회
     */
    @GetMapping("/cultivation/{cultivationRegistrationId}")
    public ResponseEntity<ApiResponse<List<HarvestRecordResponse>>> getHarvestRecords(
            @PathVariable Long cultivationRegistrationId) {

        List<HarvestRecord> records = loadHarvestUseCase.loadHarvestRecords(cultivationRegistrationId);

        List<HarvestRecordResponse> response = records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private HarvestRecordResponse mapToResponse(HarvestRecord record) {
        return HarvestRecordResponse.builder()
                .id(record.getId())
                .cultivationRegistrationId(record.getCultivationRegistrationId())
                .harvestDate(record.getHarvestDate())
                .yieldAmount(record.getYieldAmount())
                .yieldUnit(record.getYieldUnit())
                .grade(record.getGrade())
                .toShop(record.getToShop())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
