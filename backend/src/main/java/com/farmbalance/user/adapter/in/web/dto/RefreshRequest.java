package com.farmbalance.user.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class RefreshRequest {

    @NotBlank(message = "리프레시 토큰을 입력해주세요")
    private String refreshToken;
}
