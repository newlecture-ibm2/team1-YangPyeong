package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminUserResponse;
import com.farmbalance.admin.adapter.in.web.dto.ChangeUserRoleRequest;
import com.farmbalance.admin.adapter.in.web.dto.ChangeUserStatusRequest;
import com.farmbalance.admin.application.port.in.dto.AdminUserDto;
import com.farmbalance.admin.application.port.in.ManageUserUseCase;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ADM-001 사용자 관리 Controller (Driving Adapter)
 * API URL: /api/admin/users
 * 다른 도메인의 객체를 직접 import하지 않습니다.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final ManageUserUseCase manageUserUseCase;

    /**
     * 사용자 목록 조회 (검색 + 필터 + 페이징)
     * GET /api/admin/users?keyword=&role=&status=&page=0&size=20
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getUsers(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String role,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        List<AdminUserDto> dtos = manageUserUseCase.getUsers(keyword, role, status, page, size);
        List<AdminUserResponse> users = dtos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
                
        long totalCount = manageUserUseCase.countUsers(keyword, role, status);
        int totalPages = (int) Math.ceil((double) totalCount / size);

        Map<String, Object> result = Map.of(
                "users", users,
                "meta", Map.of(
                        "page", page,
                        "size", size,
                        "totalCount", totalCount,
                        "totalPages", totalPages
                )
        );
        return ApiResponse.ok(result);
    }

    /**
     * 사용자 상세 조회
     * GET /api/admin/users/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<AdminUserResponse> getUserById(@PathVariable Long id) {
        AdminUserDto dto = manageUserUseCase.getUserById(id);
        return ApiResponse.ok(mapToResponse(dto));
    }

    private AdminUserResponse mapToResponse(AdminUserDto dto) {
        return AdminUserResponse.builder()
                .id(dto.getId())
                .email(dto.getEmail())
                .name(dto.getName())
                .phone(dto.getPhone())
                .role(dto.getRole())
                .status(dto.getStatus())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .deletedAt(dto.getDeletedAt())
                .build();
    }

    /**
     * 역할 변경 (USER ↔ FARMER)
     * PATCH /api/admin/users/{id}/role
     */
    @PatchMapping("/{id}/role")
    public ApiResponse<Void> changeRole(@PathVariable Long id,
                                        @Valid @RequestBody ChangeUserRoleRequest request) {
        manageUserUseCase.changeRole(id, request.getRole());
        return ApiResponse.ok(null);
    }

    /**
     * 상태 변경 (ACTIVE ↔ SUSPENDED)
     * PATCH /api/admin/users/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ApiResponse<Void> changeStatus(@PathVariable Long id,
                                          @Valid @RequestBody ChangeUserStatusRequest request) {
        manageUserUseCase.changeStatus(id, request.getStatus());
        return ApiResponse.ok(null);
    }
}
