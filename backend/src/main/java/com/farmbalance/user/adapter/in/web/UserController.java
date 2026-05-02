package com.farmbalance.user.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.user.application.port.in.CheckNicknameUseCase;
import com.farmbalance.user.application.port.in.UpdateProfileCommand;
import com.farmbalance.user.application.port.in.UpdateProfileUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * 사용자 정보 관리 컨트롤러
 */
    @RestController
    @RequestMapping("/api/users")
    @RequiredArgsConstructor
    public class UserController {

    private final UpdateProfileUseCase updateProfileUseCase;
    private final CheckNicknameUseCase checkNicknameUseCase;

    /**
     * 프로필 수정 요청 DTO
     */
    @lombok.Getter
    @lombok.NoArgsConstructor
    public static class ProfileUpdateRequest {
        @jakarta.validation.constraints.NotBlank(message = "이름은 필수입니다.")
        @jakarta.validation.constraints.Size(max = 50)
        private String name;

        @jakarta.validation.constraints.Size(max = 20)
        private String phone;

        @jakarta.validation.constraints.Size(max = 50)
        private String region;

        @jakarta.validation.constraints.Size(max = 255)
        private String address;

        @jakarta.validation.constraints.Size(max = 1000)
        private String bio;
    }

    /**
     * 내 프로필 수정
     */
    @PutMapping("/me")
    public ApiResponse<Void> updateProfile(
            @jakarta.validation.Valid @RequestBody ProfileUpdateRequest request,
            Principal principal) {
        
        if (principal == null) {
            throw new com.farmbalance.global.error.BusinessException(com.farmbalance.global.error.ErrorCode.ACCESS_DENIED);
        }

        String email = principal.getName();
        
        UpdateProfileCommand command = UpdateProfileCommand.builder()
                .email(email)
                .name(request.getName())
                .phone(request.getPhone())
                .region(request.getRegion())
                .address(request.getAddress())
                .bio(request.getBio())
                .build();

        updateProfileUseCase.updateProfile(command);
        return ApiResponse.ok(null);
    }

    /**
     * 닉네임 중복 확인
     */
    @GetMapping("/check-nickname")
    public ApiResponse<Boolean> checkNickname(@RequestParam String name) {
        boolean available = checkNicknameUseCase.isNicknameAvailable(name);
        return ApiResponse.ok(available);
    }
}
