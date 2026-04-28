package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.FarmApprovalView;

import java.util.List;

/**
 * ADM-002 농부 승인/반려 Input Port
 * 농장 등록 신청 목록 조회, 승인, 반려
 */
public interface ManageApprovalUseCase {

    /**
     * 상태별 농장 신청 목록 조회
     * @param status PENDING | APPROVED | REJECTED
     */
    List<FarmApprovalView> getApprovalsByStatus(String status);

    /**
     * 농장 승인 (farm.status → APPROVED, user.role → FARMER)
     */
    void approve(Long farmId);

    /**
     * 농장 반려 (farm.status → REJECTED)
     */
    void reject(Long farmId);
}
