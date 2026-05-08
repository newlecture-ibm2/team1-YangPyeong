package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.adapter.in.web.dto.AdminShopProductResponse;

import java.util.List;

/**
 * ADM-009 상점 관리 Input Port
 * 상품 목록 조회, 상태 변경 (승인/반려/비활성화)
 */
public interface ManageShopUseCase {

    /**
     * 전체 상품 목록 조회 (관리자용)
     */
    List<AdminShopProductResponse> getAllProducts();

    /**
     * 상품 상태 변경 (ACTIVE / INACTIVE / REJECTED 등)
     */
    void updateProductStatus(Long productId, String status);
}
