package com.farmbalance.shop.application.port.in;

import com.farmbalance.shop.domain.Product;

import java.util.List;

/**
 * 판매자 상품 관리 UseCase (Input Port).
 */
public interface ManageProductUseCase {

    /** 상품 등록 */
    Product registerProduct(Long sellerId, String name, int price, int stock,
                            String description, String categoryName, List<String> imageUrls);

    /** 상품 수정 */
    Product updateProduct(Long sellerId, Long productId, String name, int price, int stock,
                          String description, String categoryName, List<String> imageUrls);

    /** 상품 상태(판매중/품절/숨김) 변경 */
    Product changeProductStatus(Long sellerId, Long productId, String newStatus);

    /** 상품 삭제 (soft delete) */
    void deleteProduct(Long sellerId, Long productId);

    /** 판매자의 상품 목록 조회 */
    List<Product> getSellerProducts(Long sellerId);
}
