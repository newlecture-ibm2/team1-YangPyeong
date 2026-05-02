package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageFarmApprovalUseCase;
import com.farmbalance.admin.application.port.out.AdminFarmPort;
import com.farmbalance.admin.application.port.out.AdminUserPort;
import com.farmbalance.admin.domain.AdminFarm;
import com.farmbalance.admin.domain.FarmApprovalView;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ADM-002 농부 승인/반려 Service
 * 승인 시: farm.status → APPROVED + user.role → FARMER (트랜잭션)
 * 반려 시: farm.status → REJECTED
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmApprovalService implements ManageFarmApprovalUseCase {

    private final AdminFarmPort adminFarmPort;
    private final AdminUserPort adminUserPort;

    @Override
    public List<FarmApprovalView> getApprovalsByStatus(String status) {
        return adminFarmPort.findApprovalsByStatus(status.toUpperCase());
    }

    @Override
    @Transactional
    public void approve(Long farmId) {
        AdminFarm farm = adminFarmPort.findById(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        if (!"PENDING".equals(farm.getStatus())) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 처리된 신청입니다. (현재 상태: " + farm.getStatus() + ")");
        }

        // 1. 농장 상태 → APPROVED
        adminFarmPort.updateStatus(farmId, "APPROVED");

        // 2. 신청자 역할 → FARMER
        adminUserPort.updateRole(farm.getUserId(), "FARMER");
    }

    @Override
    @Transactional
    public void reject(Long farmId, String reason) {
        AdminFarm farm = adminFarmPort.findById(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        if (!"PENDING".equals(farm.getStatus())) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 처리된 신청입니다. (현재 상태: " + farm.getStatus() + ")");
        }

        // 농장 상태 → REJECTED + 반려 사유 저장
        adminFarmPort.updateStatusWithReason(farmId, "REJECTED", reason);
    }
}
