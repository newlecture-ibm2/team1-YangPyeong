package com.farmbalance.history.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.history.adapter.in.web.dto.CreateHistoryRequest;
import com.farmbalance.history.adapter.in.web.dto.HistoryResponse;
import com.farmbalance.history.adapter.in.web.dto.UpdateHistoryRequest;
import com.farmbalance.history.application.port.in.*;
import com.farmbalance.history.domain.CultivationHistory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/farms", "/api/farm"})
@RequiredArgsConstructor
public class HistoryController {

    private final RecordHistoryUseCase recordHistoryUseCase;
    private final LoadHistoryUseCase loadHistoryUseCase;
    private final UpdateHistoryUseCase updateHistoryUseCase;
    private final DeleteHistoryUseCase deleteHistoryUseCase;

    /**
     * 농장 히스토리 조회
     */
    @GetMapping("/{farmId}/histories")
    public ApiResponse<List<HistoryResponse>> getHistories(@PathVariable Long farmId) {
        List<CultivationHistory> histories = loadHistoryUseCase.getHistoriesByFarmId(farmId);
        
        List<HistoryResponse> response = histories.stream()
                .map(h -> HistoryResponse.builder()
                        .id(h.getId())
                        .farmId(h.getFarmId())
                        .historyType(h.getHistoryType())
                        .content(h.getContent())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
                
        return ApiResponse.ok(response);
    }

    /**
     * 농장 히스토리 기록
     */
    @PostMapping("/{farmId}/histories")
    public ApiResponse<Void> recordHistory(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateHistoryRequest request) {
            
        RecordHistoryCommand command = RecordHistoryCommand.builder()
                .farmId(farmId)
                .historyType(request.getHistoryType())
                .content(request.getContent())
                .build();
                
        recordHistoryUseCase.recordHistory(command);
        
        return ApiResponse.ok(null);
    }

    /**
     * 농장 히스토리 수정
     */
    @PatchMapping("/{farmId}/histories/{historyId}")
    public ApiResponse<Void> updateHistory(
            @PathVariable Long farmId,
            @PathVariable Long historyId,
            @Valid @RequestBody UpdateHistoryRequest request) {
            
        updateHistoryUseCase.updateHistory(historyId, request.getContent(), request.getHistoryType());
        
        return ApiResponse.ok(null);
    }

    /**
     * 농장 히스토리 삭제
     */
    @DeleteMapping("/{farmId}/histories/{historyId}")
    public ApiResponse<Void> deleteHistory(
            @PathVariable Long farmId,
            @PathVariable Long historyId) {
            
        deleteHistoryUseCase.deleteHistory(historyId);
        
        return ApiResponse.ok(null);
    }
}
