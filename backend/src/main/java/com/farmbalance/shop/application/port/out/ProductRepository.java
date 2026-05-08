package com.farmbalance.shop.application.port.out;

import com.farmbalance.shop.domain.Product;

import java.util.List;
import java.util.Optional;

/**
 * 상품 영속성 Port (Output Port).
 */
public interface ProductRepository {

    /** 상품 저장 (신규/수정) */
    Product save(Product product);

    /** 상품 조회 */
    Optional<Product> findById(Long id);

    /** 상품 목록 조회 (카테고리 필터, 정렬, 페이징) */
    List<Product> findAll(String category, String sort, String keyword, int page, int size);

    /** 전체 상품 수 (필터 적용) */
    long count(String category, String keyword);

    /** 판매자의 상품 목록 */
    List<Product> findBySellerId(Long sellerId);

    /** 상품 삭제 (soft delete) */
    void softDelete(Long id);

    /** 전체 상품 목록 조회 — 관리자용 (삭제되지 않은 전체, 필터 없음) */
    List<Product> findAllProducts();

    /** 관리자용 상품 목록 조회 (필터, 정렬, 페이징) */
    List<Product> findAdminProducts(String keyword, String category, String status, String sort, int page, int size);

    /** 관리자용 상품 총 개수 (필터 적용) */
    long countAdminProducts(String keyword, String category, String status);

    /** 상품 상태 변경 — 관리자용 (ACTIVE / INACTIVE / REJECTED 등) */
    void updateStatus(Long id, String status);
}
