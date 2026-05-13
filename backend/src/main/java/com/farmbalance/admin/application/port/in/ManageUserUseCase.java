package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.application.port.in.dto.AdminUserDto;

import java.util.List;

/**
 * ADM-001 사용자 관리 Input Port
 * 목록 조회(검색/필터/페이징), 역할 변경, 정지/재활성화
 */
public interface ManageUserUseCase {

    /**
     * 사용자 목록 조회 (검색 + 필터 + 페이징)
     */
    List<AdminUserDto> getUsers(String keyword, String role, String status, int page, int size);

    /**
     * 전체 건수 조회 (페이징 메타데이터용)
     */
    long countUsers(String keyword, String role, String status);

    /**
     * 사용자 상세 조회
     */
    AdminUserDto getUserById(Long id);

    /**
     * 역할 변경 (USER ↔ FARMER)
     */
    void changeRole(Long id, String role);

    /**
     * 상태 변경 (ACTIVE ↔ SUSPENDED)
     */
    void changeStatus(Long id, String status);

    /**
     * 관리자 강제 탈퇴 처리
     */
    void forceWithdrawUser(Long id, String reasonType, String detail);

    /**
     * 관리자 수동 탈퇴 복구
     */
    void reactivateUser(Long id);

    /**
     * 관리자 특수 계정(지자체, 관리자 등) 직접 발급
     */
    void createUser(String email, String password, String name, String role);
}
