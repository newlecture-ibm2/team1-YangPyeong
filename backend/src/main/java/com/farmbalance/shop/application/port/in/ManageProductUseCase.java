package com.farmbalance.shop.application.port.in;

import com.farmbalance.shop.domain.Product;

import java.util.List;

/**
 * 판매자 상품 관리 UseCase (Input Port).
 */
public interface ManageProductUseCase {

    /** 상품 등록 (unitKg: 1개당 판매 단위 kg) */
    Product registerProduct(Long sellerId, String name, int price, int stock, int unitKg,
                            String description, String categoryName, List<String> imageUrls);

    /**
     * 상품 전체 수정 (콘텐츠 변경 — ACTIVE 상태일 때만 허용, 재검수 진입).
     * unitKg: null 이면 기존 값 유지.
     */
    Product updateProduct(Long sellerId, Long productId, String name, int price, int stock,
                          Integer unitKg, String description, String categoryName, List<String> imageUrls);

    /**
     * 가격·재고·판매단위 수정 (운영 정보 — 검수 상태와 무관하게 즉시 반영).
     * price, stock, unitKg 중 null인 항목은 기존 값 유지.
     */
    Product updateInventory(Long sellerId, Long productId, Integer price, Integer stock, Integer unitKg);

    /** 상품 상태(판매중/품절/숨김) 변경 */
    Product changeProductStatus(Long sellerId, Long productId, String newStatus);

    /** 상품 삭제 (soft delete) */
    void deleteProduct(Long sellerId, Long productId);

    /** 판매자의 상품 목록 조회 */
    List<Product> getSellerProducts(Long sellerId);
}
