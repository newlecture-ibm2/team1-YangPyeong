package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminFarm;

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

    void updateLandCertVerified(Long id, Boolean verified);
}
