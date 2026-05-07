package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 역할 변경 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ChangeUserRoleRequest {

    @NotBlank(message = "역할은 필수입니다.")
    private String role;
}
