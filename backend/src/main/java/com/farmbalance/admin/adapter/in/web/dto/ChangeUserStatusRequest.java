package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 상태 변경 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ChangeUserStatusRequest {

    @NotBlank(message = "상태는 필수입니다.")
    private String status;

    private String reason;
}
