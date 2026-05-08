package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.adapter.in.web.dto.AdminShopProductResponse;

import java.util.List;

/**
 * ADM-009 상점 관리 Input Port
 * 상품 목록 조회, 상태 변경 (승인/반려/비활성화)
 */
public interface ManageShopUseCase {

    /**
     * 상품 목록 조회 (검색 + 필터 + 정렬 + 페이징)
     */
    List<AdminShopProductResponse> getProducts(String keyword, String category, String status, String sort, int page, int size);

    /**
     * 상품 목록 총 개수 (검색 + 필터)
     */
    long countProducts(String keyword, String category, String status);

    /**
     * 상품 상태 변경 (ACTIVE / INACTIVE / REJECTED 등)
     */
    void updateProductStatus(Long productId, String status);
}
