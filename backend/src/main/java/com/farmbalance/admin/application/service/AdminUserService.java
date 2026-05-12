package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.dto.AdminUserDto;
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
 * Domain → DTO 변환은 Service에서 담당합니다.
 */
import com.farmbalance.admin.adapter.out.persistence.entity.UserSanctionLogJpaEntity;
import com.farmbalance.admin.adapter.out.persistence.repository.UserSanctionLogJpaRepository;
import com.farmbalance.user.application.port.in.UpdateProfileUseCase;
import com.farmbalance.user.application.port.out.UserRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService implements ManageUserUseCase {

    private final UserRepository userRepository;
    private final UpdateProfileUseCase updateProfileUseCase;
    private final UserSanctionLogJpaRepository sanctionLogRepository;

    /** 역할 변경 시 허용되는 값 */
    private static final Set<String> ALLOWED_ROLES = Set.of("USER", "FARMER");

    /** 상태 변경 시 허용되는 값 */
    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "SUSPENDED");

    @Override
    public List<AdminUserDto> getUsers(String keyword, String role, String status, int page, int size) {
        int offset = page * size;
        return userRepository.findByFilter(keyword, role, status, offset, size).stream()
                .map(AdminUserDto::from)
                .toList();
    }

    @Override
    public long countUsers(String keyword, String role, String status) {
        return userRepository.countByFilter(keyword, role, status);
    }

    @Override
    public AdminUserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return AdminUserDto.from(user);
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

    @Override
    @Transactional
    public void forceWithdrawUser(Long id, String reasonType, String detail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 로그 기록
        UserSanctionLogJpaEntity logEntity = UserSanctionLogJpaEntity.builder()
                .targetUserId(id)
                .actionType("WITHDRAW")
                .reasonType(reasonType)
                .reasonDetail(detail)
                .build();
        sanctionLogRepository.save(logEntity);

        // 실제 탈퇴 로직 위임 (당일 즉시 WITHDRAWN 처리 및 이벤트 발행)
        updateProfileUseCase.withdrawAccount(user.getEmail());
    }

    @Override
    @Transactional
    public void reactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 로그 기록
        UserSanctionLogJpaEntity logEntity = UserSanctionLogJpaEntity.builder()
                .targetUserId(id)
                .actionType("REACTIVATE")
                .reasonType("MANUAL_RESTORE")
                .reasonDetail("관리자 수동 복구")
                .build();
        sanctionLogRepository.save(logEntity);

        // 실제 복구 로직 위임 (상태 ACTIVE 전환 등)
        updateProfileUseCase.reactivateAccount(user.getEmail());
    }
}
