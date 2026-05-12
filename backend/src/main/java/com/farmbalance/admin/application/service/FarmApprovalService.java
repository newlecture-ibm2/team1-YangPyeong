package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.dto.AdminFarmApprovalDto;
import com.farmbalance.admin.application.port.in.ManageFarmApprovalUseCase;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.CertificationStatus;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ADM-002 농부 승인/반려 Service
 * 승인 시: farm.status → APPROVED + user.role → FARMER (트랜잭션)
 * 반려 시: farm.status → REJECTED + 반려 사유 저장
 *
 * [리팩터링] AdminFarmPort(JdbcTemplate) → LoadFarmPort + SaveFarmPort(JPA) 경유
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmApprovalService implements ManageFarmApprovalUseCase {

    private final LoadFarmPort loadFarmPort;
    private final SaveFarmPort saveFarmPort;
    private final UserRepository userRepository;

    @Override
    public List<AdminFarmApprovalDto> getApprovalsByStatus(String status) {
        List<Farm> farms = loadFarmPort.loadFarmsByStatus(status.toUpperCase());
        return farms.stream()
                .map(farm -> {
                    User user = userRepository.findById(farm.getUserId()).orElse(null);
                    return AdminFarmApprovalDto.from(farm, user);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approve(Long farmId) {
        Farm farm = loadFarmPort.loadFarmById(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        if (farm.getCertificationStatus() != CertificationStatus.PENDING) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 처리된 신청입니다. (현재 상태: " + farm.getCertificationStatus() + ")");
        }

        // 1. 농장 상태 → APPROVED
        saveFarmPort.updateCertificationStatus(farmId, "APPROVED");

        // 2. 신청자 역할 → FARMER
        userRepository.updateRole(farm.getUserId(), "FARMER");
    }

    @Override
    @Transactional
    public void reject(Long farmId, String reason) {
        Farm farm = loadFarmPort.loadFarmById(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        if (farm.getCertificationStatus() != CertificationStatus.PENDING) {
            throw new BusinessException(ErrorCode.ADMIN_ACTION_FAILED,
                    "이미 처리된 신청입니다. (현재 상태: " + farm.getCertificationStatus() + ")");
        }

        // 농장 상태 → REJECTED + 반려 사유 저장
        saveFarmPort.updateCertificationStatusWithReason(farmId, "REJECTED", reason);
    }

    @Override
    @Transactional
    public void deleteFarm(Long farmId) {
        Farm farm = loadFarmPort.loadFarmById(farmId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FARM_NOT_FOUND));

        saveFarmPort.deleteFarm(farmId);
    }
}
