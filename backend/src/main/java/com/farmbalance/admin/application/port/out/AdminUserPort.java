package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminUser;

import java.util.List;
import java.util.Optional;

/**
 * ADM-001 사용자 관리용 Output Port
 */
public interface AdminUserPort {

    List<AdminUser> findAll();

    Optional<AdminUser> findById(Long id);

    void updateRole(Long id, String role);

    void updateStatus(Long id, String status);
}
