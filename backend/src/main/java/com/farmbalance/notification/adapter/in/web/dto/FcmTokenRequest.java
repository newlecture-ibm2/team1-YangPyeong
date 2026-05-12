package com.farmbalance.notification.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FcmTokenRequest {
    @NotBlank(message = "FCM 토큰은 필수입니다.")
    private String token;
    
    private String deviceType = "WEB";
}
