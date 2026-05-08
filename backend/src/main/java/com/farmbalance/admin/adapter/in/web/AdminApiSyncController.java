package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.ManageApiSyncUseCase;
import com.farmbalance.admin.domain.ApiSyncStatus;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ADM-004 API 동기화 상태 관리 Controller (Driving Adapter)
 * API URL: /api/admin/api-sync
 */
@RestController
@RequestMapping("/api/admin/api-sync")
@RequiredArgsConstructor
public class AdminApiSyncController {

    private final ManageApiSyncUseCase manageApiSyncUseCase;

    /** 전체 API 동기화 상태 목록 조회 */
    @GetMapping
    public ApiResponse<List<ApiSyncStatus>> getAllApiSyncStatuses() {
        return ApiResponse.ok(manageApiSyncUseCase.getAllApiSyncStatuses());
    }

    /** 단건 조회 */
    @GetMapping("/{id}")
    public ApiResponse<ApiSyncStatus> getApiSyncStatus(@PathVariable Long id) {
        return ApiResponse.ok(manageApiSyncUseCase.getApiSyncStatusById(id));
    }

    /** API 이름으로 조회 */
    @GetMapping("/by-name/{apiName}")
    public ApiResponse<ApiSyncStatus> getApiSyncStatusByName(@PathVariable String apiName) {
        return ApiResponse.ok(manageApiSyncUseCase.getApiSyncStatusByName(apiName));
    }

    /** 활성/비활성 토글 (On/Off 스위치) */
    @PatchMapping("/{id}/toggle")
    public ApiResponse<Void> toggleActive(@PathVariable Long id,
                                          @RequestBody Map<String, Boolean> body) {
        Boolean isActive = body.get("isActive");
        if (isActive == null) {
            throw new IllegalArgumentException("isActive 값은 필수입니다.");
        }
        manageApiSyncUseCase.toggleActive(id, isActive);
        return ApiResponse.ok(null);
    }

    /** 수동 동기화 트리거 */
    @PostMapping("/{id}/trigger")
    public ApiResponse<Void> triggerSync(@PathVariable Long id) {
        manageApiSyncUseCase.triggerSync(id);
        return ApiResponse.ok(null);
    }
}
