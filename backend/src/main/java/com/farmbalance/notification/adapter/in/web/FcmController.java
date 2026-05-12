package com.farmbalance.notification.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.notification.adapter.in.web.dto.FcmTokenRequest;
import com.farmbalance.notification.application.port.in.FcmTokenUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fcm")
@RequiredArgsConstructor
public class FcmController {

    private final FcmTokenUseCase fcmTokenUseCase;

    @PostMapping("/tokens")
    public ApiResponse<Void> registerToken(@AuthenticationPrincipal Long userId,
                                           @Valid @RequestBody FcmTokenRequest request) {
        if (userId != null) {
            fcmTokenUseCase.registerToken(userId, request.getToken(), request.getDeviceType());
        }
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/tokens")
    public ApiResponse<Void> deleteToken(@AuthenticationPrincipal Long userId,
                                         @RequestBody FcmTokenRequest request) {
        if (userId != null) {
            fcmTokenUseCase.deleteToken(userId, request.getToken());
        }
        return ApiResponse.ok(null);
    }
}
