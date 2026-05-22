package com.farmbalance.shop.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.shop.adapter.in.web.dto.*;
import com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductCategoryJpaRepository;
import com.farmbalance.shop.application.port.in.GetProductUseCase;
import com.farmbalance.shop.application.port.in.ManageProductUseCase;
import com.farmbalance.shop.domain.Product;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 상품 Controller (Driving Adapter).
 * 공통 상품 조회 + 판매자 상품 관리 API.
 */
@RestController
@RequestMapping("/api/shop")
public class ProductController {

    private final GetProductUseCase getProductUseCase;
    private final ManageProductUseCase manageProductUseCase;
    private final ProductCategoryJpaRepository categoryRepository;

    public ProductController(GetProductUseCase getProductUseCase,
                             ManageProductUseCase manageProductUseCase,
                             ProductCategoryJpaRepository categoryRepository) {
        this.getProductUseCase = getProductUseCase;
        this.manageProductUseCase = manageProductUseCase;
        this.categoryRepository = categoryRepository;
    }

    // ── 카테고리 ──

    /** 활성 카테고리 목록 조회 */
    @GetMapping("/category")
    public ApiResponse<List<Map<String, Object>>> getCategories() {
        List<Map<String, Object>> categories = categoryRepository
                .findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "name", c.getName(),
                        "displayOrder", c.getDisplayOrder()
                ))
                .toList();
        return ApiResponse.ok(categories);
    }

    // ── 공통 상품 조회 ──

    /** 상품 목록 조회 */
    @GetMapping("/product")
    public ApiResponse<List<ProductResponse>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "latest") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        List<Product> products = getProductUseCase.getProducts(category, sort, keyword, page, size);
        long total = getProductUseCase.countProducts(category, keyword);

        List<ProductResponse> data = products.stream().map(ProductResponse::from).toList();
        return ApiResponse.ok(data, ApiResponse.Meta.of(page, size, total));
    }

    /** 상품 상세 조회 */
    @GetMapping("/product/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable Long id) {
        Product product = getProductUseCase.getProduct(id);
        return ApiResponse.ok(ProductResponse.from(product));
    }

    // ── 판매자 상품 관리 ──

    /** 판매자 상품 등록 */
    @PostMapping("/seller")
    public ApiResponse<ProductResponse> registerProduct(@RequestBody ProductRegisterRequest request) {
        Long sellerId = SecurityUtil.getCurrentUserId();
        Product product = manageProductUseCase.registerProduct(
                sellerId, request.name(), request.price(), request.stock(), request.unitKgOrDefault(),
                request.description(), request.categoryName(), request.imageUrls()
        );
        return ApiResponse.ok(ProductResponse.from(product));
    }

    /** 판매자 상품 수정 */
    @PatchMapping("/seller/{id}")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable Long id,
                                                       @RequestBody ProductUpdateRequest request) {
        Long sellerId = SecurityUtil.getCurrentUserId();
        Product product = manageProductUseCase.updateProduct(
                sellerId, id, request.name(), request.price(), request.stock(),
                request.unitKg(), request.description(), request.categoryName(), request.imageUrls()
        );
        return ApiResponse.ok(ProductResponse.from(product));
    }

    /** 판매자 상품 삭제 */
    @DeleteMapping("/seller/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        Long sellerId = SecurityUtil.getCurrentUserId();
        manageProductUseCase.deleteProduct(sellerId, id);
        return ApiResponse.ok(null);
    }

    /**
     * 가격·재고·판매단위 수정 (운영 정보 — 검수중 포함 모든 상태에서 즉시 반영).
     * 콘텐츠(이름·설명·이미지·카테고리) 변경 없이 재고·가격·단위만 바꿀 때 사용.
     */
    @PatchMapping("/seller/{id}/inventory")
    public ApiResponse<ProductResponse> updateInventory(@PathVariable Long id,
                                                         @RequestBody InventoryUpdateRequest request) {
        if (request.price() == null && request.stock() == null && request.unitKg() == null) {
            return ApiResponse.fail("E-COMMON-002", "price, stock, unitKg 중 하나 이상 입력해야 합니다.");
        }
        Long sellerId = SecurityUtil.getCurrentUserId();
        Product product = manageProductUseCase.updateInventory(sellerId, id, request.price(), request.stock(), request.unitKg());
        return ApiResponse.ok(ProductResponse.from(product));
    }

    /** 판매자 상품 상태 변경 */
    @PatchMapping("/seller/{id}/status")
    public ApiResponse<ProductResponse> changeProductStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Long sellerId = SecurityUtil.getCurrentUserId();
        String newStatus = request.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ApiResponse.fail("E-GLOBAL-400", "상태값이 필요합니다.");
        }
        Product product = manageProductUseCase.changeProductStatus(sellerId, id, newStatus);
        return ApiResponse.ok(ProductResponse.from(product));
    }

    /** 판매자의 내 상품 목록 */
    @GetMapping("/seller")
    public ApiResponse<List<ProductResponse>> getSellerProducts() {
        Long sellerId = SecurityUtil.getCurrentUserId();
        List<Product> products = manageProductUseCase.getSellerProducts(sellerId);
        return ApiResponse.ok(products.stream().map(ProductResponse::from).toList());
    }
}
