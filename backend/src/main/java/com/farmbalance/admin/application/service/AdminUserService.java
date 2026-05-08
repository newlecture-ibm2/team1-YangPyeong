package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.AdminUserResponse;
import com.farmbalance.admin.application.port.in.ManageUserUseCase;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * ADM-001 사용자 관리 Service
 * 헥사고날 아키텍처: user 도메인의 Output Port를 통해 데이터에 접근합니다.
 * Domain → Response DTO 변환은 Service에서 담당합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService implements ManageUserUseCase {

    private final UserRepository userRepository;

    /** 역할 변경 시 허용되는 값 */
    private static final Set<String> ALLOWED_ROLES = Set.of("USER", "FARMER");

    /** 상태 변경 시 허용되는 값 */
    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "SUSPENDED");

    @Override
    public List<AdminUserResponse> getUsers(String keyword, String role, String status, int page, int size) {
        int offset = page * size;
        return userRepository.findByFilter(keyword, role, status, offset, size).stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    @Override
    public long countUsers(String keyword, String role, String status) {
        return userRepository.countByFilter(keyword, role, status);
    }

    @Override
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return AdminUserResponse.from(user);
    }

    @Override
    @Transactional
    public void changeRole(Long id, String role) {
        String upperRole = role.toUpperCase();
        if (!ALLOWED_ROLES.contains(upperRole)) {
            throw new BusinessException(ErrorCode.ADMIN_INVALID_ROLE);
        }
        userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        userRepository.updateRole(id, upperRole);
    }

    @Override
    @Transactional
    public void changeStatus(Long id, String status) {
        String upperStatus = status.toUpperCase();
        if (!ALLOWED_STATUSES.contains(upperStatus)) {
            throw new BusinessException(ErrorCode.ADMIN_INVALID_STATUS);
        }
        userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        userRepository.updateStatus(id, upperStatus);
    }
}
