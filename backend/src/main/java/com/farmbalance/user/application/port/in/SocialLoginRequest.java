package com.farmbalance.user.application.port.in;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class SocialLoginRequest {

    @NotBlank(message = "소셜 로그인 제공자를 입력해주세요")
    private String provider;

    @NotBlank(message = "소셜 액세스 토큰을 입력해주세요")
    private String accessToken;
}
