package com.farmbalance.user.application.port.in;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
}
