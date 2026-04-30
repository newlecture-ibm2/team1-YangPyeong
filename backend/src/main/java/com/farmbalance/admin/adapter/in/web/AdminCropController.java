package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.CreateCropCategoryRequest;
import com.farmbalance.admin.adapter.in.web.dto.CreateCropRequest;
import com.farmbalance.admin.adapter.in.web.dto.UpdateCropCategoryRequest;
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
 * 작물 CRUD + 카테고리 CRUD
 */
@RestController
@RequestMapping("/api/admins/crops")
@RequiredArgsConstructor
public class AdminCropController {

    private final ManageCropUseCase manageCropUseCase;

    // ── 카테고리 ──

    @GetMapping("/categories")
    public ApiResponse<List<AdminCropCategory>> getCategories() {
        return ApiResponse.ok(manageCropUseCase.getAllCategories());
    }

    @PostMapping("/categories")
    public ApiResponse<Long> createCategory(@RequestBody CreateCropCategoryRequest request) {
        AdminCropCategory category = AdminCropCategory.builder()
                .name(request.getName())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder())
                .build();
        Long id = manageCropUseCase.createCategory(category);
        return ApiResponse.ok(id);
    }

    @PatchMapping("/categories/{id}")
    public ApiResponse<Void> updateCategory(@PathVariable Long id, @RequestBody UpdateCropCategoryRequest request) {
        AdminCropCategory category = AdminCropCategory.builder()
                .name(request.getName())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder())
                .isActive(request.getIsActive())
                .build();
        manageCropUseCase.updateCategory(id, category);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        manageCropUseCase.deleteCategory(id);
        return ApiResponse.ok(null);
    }

    // ── 작물 ──

    @GetMapping
    public ApiResponse<List<AdminCrop>> getCrops(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(manageCropUseCase.getCrops(categoryId, keyword));
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminCrop> getCropById(@PathVariable Long id) {
        return ApiResponse.ok(manageCropUseCase.getCropById(id));
    }

    @PostMapping
    public ApiResponse<Long> createCrop(@RequestBody CreateCropRequest request) {
        AdminCrop crop = AdminCrop.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .build();
        Long id = manageCropUseCase.createCrop(crop);
        return ApiResponse.ok(id);
    }

    @PatchMapping("/{id}")
    public ApiResponse<Void> updateCrop(@PathVariable Long id, @RequestBody UpdateCropRequest request) {
        AdminCrop crop = AdminCrop.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .build();
        manageCropUseCase.updateCrop(id, crop);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCrop(@PathVariable Long id) {
        manageCropUseCase.deleteCrop(id);
        return ApiResponse.ok(null);
    }
}
