package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ManageUserUseCase;
import com.farmbalance.admin.application.port.out.AdminUserPort;
import com.farmbalance.admin.domain.AdminUser;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * ADM-001 사용자 관리 Service
 * 목록 조회(검색/필터/페이징), 역할 변경(USER ↔ FARMER), 정지/재활성화
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService implements ManageUserUseCase {

    private final AdminUserPort adminUserPort;

    /** 역할 변경 시 허용되는 값 */
    private static final Set<String> ALLOWED_ROLES = Set.of("USER", "FARMER");

    /** 상태 변경 시 허용되는 값 */
    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "SUSPENDED");

    @Override
    public List<AdminUser> getUsers(String keyword, String role, String status, int page, int size) {
        int offset = page * size;
        return adminUserPort.findByFilter(keyword, role, status, offset, size);
    }

    @Override
    public long countUsers(String keyword, String role, String status) {
        return adminUserPort.countByFilter(keyword, role, status);
    }

    @Override
    public AdminUser getUserById(Long id) {
        return adminUserPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional
    public void changeRole(Long id, String role) {
        String upperRole = role.toUpperCase();
        if (!ALLOWED_ROLES.contains(upperRole)) {
            throw new BusinessException(ErrorCode.ADMIN_INVALID_ROLE);
        }
        // 사용자 존재 여부 확인
        adminUserPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        adminUserPort.updateRole(id, upperRole);
    }

    @Override
    @Transactional
    public void changeStatus(Long id, String status) {
        String upperStatus = status.toUpperCase();
        if (!ALLOWED_STATUSES.contains(upperStatus)) {
            throw new BusinessException(ErrorCode.ADMIN_INVALID_STATUS);
        }
        // 사용자 존재 여부 확인
        adminUserPort.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        adminUserPort.updateStatus(id, upperStatus);
    }
}
