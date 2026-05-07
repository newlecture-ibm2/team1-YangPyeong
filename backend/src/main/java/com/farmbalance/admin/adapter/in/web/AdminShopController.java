package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.admin.domain.AdminProduct;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ADM-009 상점 관리 Controller (Driving Adapter)
 * API URL: /api/admin/shop
 */
@RestController
@RequestMapping("/api/admin/shop")
@RequiredArgsConstructor
public class AdminShopController {

    private final ManageShopUseCase manageShopUseCase;

    /**
     * 전체 상품 목록 조회 (관리자용)
     * GET /api/admin/shop
     */
    @GetMapping
    public ApiResponse<List<AdminProduct>> getAllProducts() {
        return ApiResponse.ok(manageShopUseCase.getAllProducts());
    }

    /**
     * 상품 상태 변경 (승인/비활성화/반려)
     * PATCH /api/admin/shop/{productId}
     * Body: { "status": "ACTIVE" }
     */
    @PatchMapping("/{productId}")
    public ApiResponse<Void> updateProductStatus(@PathVariable Long productId,
                                                  @RequestBody Map<String, String> body) {
        String status = body.get("status");
        manageShopUseCase.updateProductStatus(productId, status);
        return ApiResponse.ok(null);
    }
}
