package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminFarm;
import com.farmbalance.admin.domain.FarmApprovalView;

import java.util.List;
import java.util.Optional;

/**
 * ADM-002 농부 승인/반려용 Output Port
 */
public interface AdminFarmPort {

    List<AdminFarm> findAll();

    List<AdminFarm> findByStatus(String status);

    Optional<AdminFarm> findById(Long id);

    void updateStatus(Long id, String status);

    /**
     * 상태 변경 + 반려 사유 저장
     */
    void updateStatusWithReason(Long id, String status, String reason);

    void updateLandCertVerified(Long id, Boolean verified);

    /**
     * farms + users JOIN — 승인 목록 화면용 뷰 조회
     */
    List<FarmApprovalView> findApprovalsByStatus(String status);
}
