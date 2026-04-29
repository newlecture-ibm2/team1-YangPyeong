package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.CreateCropRequest;
import com.farmbalance.admin.adapter.in.web.dto.UpdateCropRequest;
import com.farmbalance.admin.application.port.in.ManageCropUseCase;
import com.farmbalance.admin.domain.AdminCrop;
import com.farmbalance.admin.domain.AdminCropCategory;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ADM-003 작물 마스터 관리 Controller (Driving Adapter)
 * API URL: /api/admins/crops
 */
@RestController
@RequestMapping("/api/admins/crops")
@RequiredArgsConstructor
public class AdminCropController {

    private final ManageCropUseCase manageCropUseCase;

    /** 카테고리 목록 조회 */
    @GetMapping("/categories")
    public ApiResponse<List<AdminCropCategory>> getCategories() {
        return ApiResponse.ok(manageCropUseCase.getAllCategories());
    }

    /** 작물 목록 조회 (필터링) */
    @GetMapping
    public ApiResponse<List<AdminCrop>> getCrops(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isActive) {
        return ApiResponse.ok(manageCropUseCase.getCrops(categoryId, keyword, isActive));
    }

    /** 작물 단건 조회 */
    @GetMapping("/{id}")
    public ApiResponse<AdminCrop> getCropById(@PathVariable Long id) {
        return ApiResponse.ok(manageCropUseCase.getCropById(id));
    }

    /** 작물 등록 */
    @PostMapping
    public ApiResponse<Long> createCrop(@RequestBody CreateCropRequest request) {
        AdminCrop crop = AdminCrop.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .growthDays(request.getGrowthDays())
                .yieldPerSqm(request.getYieldPerSqm())
                .avgCostPerSqm(request.getAvgCostPerSqm())
                .climateConditions(request.getClimateConditions())
                .build();
        Long id = manageCropUseCase.createCrop(crop);
        return ApiResponse.ok(id);
    }

    /** 작물 수정 */
    @PatchMapping("/{id}")
    public ApiResponse<Void> updateCrop(@PathVariable Long id, @RequestBody UpdateCropRequest request) {
        AdminCrop crop = AdminCrop.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .growthDays(request.getGrowthDays())
                .yieldPerSqm(request.getYieldPerSqm())
                .avgCostPerSqm(request.getAvgCostPerSqm())
                .climateConditions(request.getClimateConditions())
                .isActive(request.getIsActive())
                .build();
        manageCropUseCase.updateCrop(id, crop);
        return ApiResponse.ok(null);
    }

    /** 작물 비활성화 */
    @PatchMapping("/{id}/deactivate")
    public ApiResponse<Void> deactivateCrop(@PathVariable Long id) {
        manageCropUseCase.deactivateCrop(id);
        return ApiResponse.ok(null);
    }
}
