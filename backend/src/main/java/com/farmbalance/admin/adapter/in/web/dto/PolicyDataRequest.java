package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 정책 데이터 생성/수정 요청 DTO
 */
@Getter
@NoArgsConstructor
public class PolicyDataRequest {

    @NotBlank(message = "외부 정책 ID를 입력해주세요.")
    private String externalId;

    @NotBlank(message = "정책 데이터(JSON)를 입력해주세요.")
    private String data;
}
