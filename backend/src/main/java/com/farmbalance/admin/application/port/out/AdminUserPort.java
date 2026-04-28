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

    /**
     * 검색 + 필터 + 페이징 조회
     */
    List<AdminUser> findByFilter(String keyword, String role, String status, int offset, int limit);

    /**
     * 검색 + 필터 기준 총 건수
     */
    long countByFilter(String keyword, String role, String status);

    void updateRole(Long id, String role);

    void updateStatus(Long id, String status);
}
