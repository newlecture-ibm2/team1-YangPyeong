package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.adapter.in.web.dto.AdminFarmApprovalResponse;

import java.util.List;

/**
 * ADM-002 농부 승인/반려 Input Port
 * 농장 등록 신청 목록 조회, 승인, 반려
 */
public interface ManageFarmApprovalUseCase {

    /**
     * 상태별 농장 신청 목록 조회
     * @param status PENDING | APPROVED | REJECTED
     */
    List<AdminFarmApprovalResponse> getApprovalsByStatus(String status);

    /**
     * 농장 승인 (farm.status → APPROVED, user.role → FARMER)
     */
    void approve(Long farmId);

    /**
     * 농장 반려 (farm.certification_status → REJECTED, 반려 사유 저장)
     */
    void reject(Long farmId, String reason);
}
