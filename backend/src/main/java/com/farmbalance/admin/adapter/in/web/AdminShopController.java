package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminShopProductResponse;
import com.farmbalance.admin.application.port.in.dto.AdminShopProductDto;
import com.farmbalance.admin.adapter.in.web.dto.UpdateStatusRequest;
import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        List<AdminShopProductDto> dtos = manageShopUseCase.getProducts(keyword, category, status, sort, page, size);
        List<AdminShopProductResponse> products = dtos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

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

    private AdminShopProductResponse mapToResponse(AdminShopProductDto dto) {
        return AdminShopProductResponse.builder()
                .id(dto.getId())
                .sellerId(dto.getSellerId())
                .sellerName(dto.getSellerName())
                .categoryId(dto.getCategoryId())
                .categoryName(dto.getCategoryName())
                .name(dto.getName())
                .price(dto.getPrice())
                .stock(dto.getStock())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .status(dto.getStatus())
                .createdAt(dto.getCreatedAt())
                .build();
    }

    /**
     * 상품 상태 변경 (승인/비활성화/반려)
     * PATCH /api/admin/shop/{productId}
     * Body: { "status": "ACTIVE" }
     */
    @PatchMapping("/{productId}")
    public ApiResponse<Void> updateProductStatus(@PathVariable Long productId,
                                                  @RequestBody UpdateStatusRequest request) {
        manageShopUseCase.updateProductStatus(productId, request.getStatus(), request.getReason());
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

    /**
     * AI 일괄 자동 심사 실행
     * POST /api/admin/shop/ai-audit
     */
    @PostMapping("/ai-audit")
    public ApiResponse<Map<String, Integer>> aiAudit() {
        int approvedCount = manageShopUseCase.aiAuditPendingProducts();
        return ApiResponse.ok(Map.of("approvedCount", approvedCount));
    }
}
