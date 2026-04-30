package com.farmbalance.shop.application.port.in;

import com.farmbalance.shop.domain.Product;

import java.util.List;

/**
 * 상품 조회 UseCase (Input Port).
 */
public interface GetProductUseCase {

    /** 상품 목록 조회 (카테고리 필터, 정렬, 페이징) */
    List<Product> getProducts(String category, String sort, String keyword, int page, int size);

    /** 전체 상품 수 (필터 적용) */
    long countProducts(String category, String keyword);

    /** 상품 상세 조회 */
    Product getProduct(Long productId);
}
