package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminShopProductResponse;
import com.farmbalance.admin.application.port.in.ManageShopUseCase;
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
     * GET /api/admin/shop?keyword=&category=ALL&status=ALL&sort=createdAt&page=0&size=20
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getProducts(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String category,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        List<AdminShopProductResponse> products = manageShopUseCase.getProducts(keyword, category, status, sort, page, size);
        long totalCount = manageShopUseCase.countProducts(keyword, category, status);
        int totalPages = (int) Math.ceil((double) totalCount / size);

        Map<String, Object> result = Map.of(
                "products", products,
                "meta", Map.of(
                        "page", page,
                        "size", size,
                        "totalCount", totalCount,
                        "totalPages", totalPages
                )
        );
        return ApiResponse.ok(result);
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

    /**
     * 상품 삭제 (Soft Delete)
     * DELETE /api/admin/shop/{productId}
     */
    @DeleteMapping("/{productId}")
    public ApiResponse<Void> deleteProduct(@PathVariable Long productId) {
        manageShopUseCase.deleteProduct(productId);
        return ApiResponse.ok(null);
    }
}
