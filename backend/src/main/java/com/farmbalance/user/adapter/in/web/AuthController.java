package com.farmbalance.user.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.user.adapter.in.web.dto.*;
import com.farmbalance.user.application.port.in.LoginUseCase;
import com.farmbalance.user.application.port.in.SignUpUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 컨트롤러 (Driving Adapter)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final SignUpUseCase signUpUseCase;

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(loginUseCase.login(request));
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SignUpResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return ApiResponse.ok(signUpUseCase.signUp(request));
    }
}
