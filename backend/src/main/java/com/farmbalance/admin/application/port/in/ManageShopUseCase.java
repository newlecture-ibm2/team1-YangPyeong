package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.application.port.in.dto.AdminShopProductDto;

import java.util.List;

/**
 * ADM-009 상점 관리 Input Port
 * 상품 목록 조회, 상태 변경 (승인/반려/비활성화)
 */
public interface ManageShopUseCase {

    /**
     * 상품 목록 조회 (검색 + 필터 + 정렬 + 페이징)
     */
    List<AdminShopProductDto> getProducts(String keyword, String category, String status, String sort, int page, int size);

    /**
     * 상품 목록 총 개수 (검색 + 필터)
     */
    long countProducts(String keyword, String category, String status);

    /**
     * 상품 상태 변경 (ACTIVE / INACTIVE / REJECTED 등)
     */
    void updateProductStatus(Long productId, String status, String reason);

    /** 관리자 권한으로 특정 상품 삭제 (Soft Delete) */
    void deleteProduct(Long productId);

    /** AI를 활용해 PENDING 상태의 신규 상품을 일괄 자동 심사 */
    int aiAuditPendingProducts();

    /** AI를 활용해 이미 승인된 ACTIVE 상태의 상품을 재검수하여 부적절 시 HIDDEN 처리 */
    int aiAuditActiveProducts();
}
