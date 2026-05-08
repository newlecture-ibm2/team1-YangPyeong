package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.CreateRagCategoryRequest;
import com.farmbalance.admin.adapter.in.web.dto.UpdateRagCategoryRequest;
import com.farmbalance.admin.application.port.in.ManageRagCategoryUseCase;
import com.farmbalance.admin.domain.RagCategory;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RAG 카테고리 관리 Controller (Driving Adapter)
 * API URL: /api/admin/rag/categories
 */
@RestController
@RequestMapping("/api/admin/rag/categories")
@RequiredArgsConstructor
public class AdminRagCategoryController {

    private final ManageRagCategoryUseCase manageRagCategoryUseCase;

    /** 전체 카테고리 조회 */
    @GetMapping
    public ApiResponse<List<RagCategory>> getAllCategories() {
        return ApiResponse.ok(manageRagCategoryUseCase.getAllCategories());
    }

    /** 카테고리 단건 조회 */
    @GetMapping("/{id}")
    public ApiResponse<RagCategory> getCategoryById(@PathVariable Long id) {
        return ApiResponse.ok(manageRagCategoryUseCase.getCategoryById(id));
    }

    /** 카테고리 생성 */
    @PostMapping
    public ApiResponse<Long> createCategory(@RequestBody CreateRagCategoryRequest request) {
        Long id = manageRagCategoryUseCase.createCategory(
                request.getName(), request.getDescription(), request.getDisplayOrder());
        return ApiResponse.ok(id);
    }

    /** 카테고리 수정 */
    @PatchMapping("/{id}")
    public ApiResponse<Void> updateCategory(@PathVariable Long id,
                                            @RequestBody UpdateRagCategoryRequest request) {
        manageRagCategoryUseCase.updateCategory(
                id, request.getName(), request.getDescription(),
                request.getDisplayOrder(), request.getIsActive());
        return ApiResponse.ok(null);
    }

    /** 카테고리 삭제 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        manageRagCategoryUseCase.deleteCategory(id);
        return ApiResponse.ok(null);
    }
}
