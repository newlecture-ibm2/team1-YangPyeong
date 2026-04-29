package com.farmbalance.shop.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.shop.adapter.in.web.dto.*;
import com.farmbalance.shop.application.port.in.GetProductUseCase;
import com.farmbalance.shop.application.port.in.ManageProductUseCase;
import com.farmbalance.shop.domain.Product;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 상품 Controller (Driving Adapter).
 * 공통 상품 조회 + 판매자 상품 관리 API.
 */
@RestController
@RequestMapping("/api/shop")
public class ProductController {

    private final GetProductUseCase getProductUseCase;
    private final ManageProductUseCase manageProductUseCase;

    public ProductController(GetProductUseCase getProductUseCase,
                             ManageProductUseCase manageProductUseCase) {
        this.getProductUseCase = getProductUseCase;
        this.manageProductUseCase = manageProductUseCase;
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
                sellerId, request.name(), request.price(), request.stock(),
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
                request.description(), request.categoryName(), request.imageUrls()
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

    /** 판매자의 내 상품 목록 */
    @GetMapping("/seller")
    public ApiResponse<List<ProductResponse>> getSellerProducts() {
        Long sellerId = SecurityUtil.getCurrentUserId();
        List<Product> products = manageProductUseCase.getSellerProducts(sellerId);
        return ApiResponse.ok(products.stream().map(ProductResponse::from).toList());
    }
}
