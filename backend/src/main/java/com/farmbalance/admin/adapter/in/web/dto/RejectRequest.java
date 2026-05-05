package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 농장 반려 요청 DTO
 */
@Getter
@NoArgsConstructor
public class RejectRequest {

    @NotBlank(message = "반려 사유를 입력해주세요.")
    private String reason;
}
