package com.farmbalance.user.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.user.application.port.in.CheckNicknameUseCase;
import com.farmbalance.user.application.port.in.GetProfileUseCase;
import com.farmbalance.user.application.port.in.UpdateProfileCommand;
import com.farmbalance.user.application.port.in.UpdateProfileUseCase;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * 사용자 정보 관리 컨트롤러
 */
    @Slf4j
    @RestController
    @RequestMapping("/api/users")
    @RequiredArgsConstructor
    public class UserController {

    private final UpdateProfileUseCase updateProfileUseCase;
    private final CheckNicknameUseCase checkNicknameUseCase;
    private final GetProfileUseCase getProfileUseCase;
    private final PasswordEncoder passwordEncoder;

    /** 프로필 이미지 저장 디렉토리 */
    private static final Path UPLOAD_DIR = Paths.get("uploads", "profiles");

    /**
     * 프로필 응답 DTO
     */
    @lombok.Getter
    @lombok.Builder
    public static class ProfileResponse {
        private String email;
        private String name;
        private String phone;
        private String region;
        private String address;
        private String bio;
        private String role;
        private String provider;
        private String profileImageUrl;
        private String createdAt;
    }

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
     * 내 프로필 조회
     */
    @GetMapping("/me")
    public ApiResponse<ProfileResponse> getMyProfile(Principal principal) {
        if (principal == null) {
            throw new com.farmbalance.global.error.BusinessException(com.farmbalance.global.error.ErrorCode.ACCESS_DENIED);
        }

        String email = principal.getName();
        User user = getProfileUseCase.getProfile(email);

        ProfileResponse response = ProfileResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .region(user.getRegion())
                .address(user.getAddress())
                .bio(user.getBio())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .provider(user.getProvider() != null ? user.getProvider().name() : "LOCAL")
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();

        return ApiResponse.ok(response);
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
     * 프로필 이미지 업로드
     */
    @PostMapping("/me/profile-image")
    public ApiResponse<Map<String, String>> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        if (principal == null) {
            throw new com.farmbalance.global.error.BusinessException(com.farmbalance.global.error.ErrorCode.ACCESS_DENIED);
        }

        // 파일 유효성 검사
        if (file.isEmpty()) {
            throw new com.farmbalance.global.error.BusinessException(
                    com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "파일이 비어있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new com.farmbalance.global.error.BusinessException(
                    com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "이미지 파일만 업로드 가능합니다.");
        }

        try {
            // 디렉토리 생성
            Files.createDirectories(UPLOAD_DIR);

            // 고유 파일명 생성
            String originalFilename = file.getOriginalFilename();
            String ext = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String storedFilename = UUID.randomUUID() + ext;

            // 파일 저장
            Path filePath = UPLOAD_DIR.resolve(storedFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // DB에 이미지 URL 저장
            String imageUrl = "/api/users/profile-image/" + storedFilename;
            String email = principal.getName();
            User user = getProfileUseCase.getProfile(email);
            user.updateProfileImageUrl(imageUrl);
            // UserService를 통해 저장
            updateProfileUseCase.updateProfileImage(email, imageUrl);

            log.info("프로필 이미지 업로드 완료: email={}, file={}", email, storedFilename);

            return ApiResponse.ok(Map.of("profileImageUrl", imageUrl));
        } catch (IOException e) {
            log.error("프로필 이미지 업로드 실패", e);
            throw new com.farmbalance.global.error.BusinessException(
                    com.farmbalance.global.error.ErrorCode.INTERNAL_ERROR, "이미지 저장에 실패했습니다.");
        }
    }

    /**
     * 프로필 이미지 조회 (정적 파일 서빙)
     */
    @GetMapping("/profile-image/{filename}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        try {
            Path filePath = UPLOAD_DIR.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 닉네임 중복 확인
     * - excludeEmail: 프로필 수정 시 자기 자신 제외 (선택)
     */
    @GetMapping("/check-nickname")
    public ApiResponse<Boolean> checkNickname(
            @RequestParam String name,
            @RequestParam(required = false) String excludeEmail) {
        boolean available = (excludeEmail != null && !excludeEmail.isBlank())
                ? checkNicknameUseCase.isNicknameAvailable(name, excludeEmail)
                : checkNicknameUseCase.isNicknameAvailable(name);
        return ApiResponse.ok(available);
    }

    /**
     * 이메일 상태 확인 (회원가입 시 실시간 검증용)
     * - available: 사용 가능
     * - exists: 이미 활성 계정 존재
     * - withdrawn: 탈퇴 계정 (재가입 가능)
     */
    @GetMapping("/check-email")
    public ApiResponse<Map<String, String>> checkEmail(@RequestParam String email) {
        java.util.Optional<User> userOpt = getProfileUseCase.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ApiResponse.ok(Map.of("status", "available"));
        }

        User user = userOpt.get();
        if (user.getStatus() == com.farmbalance.user.domain.UserStatus.WITHDRAWN) {
            return ApiResponse.ok(Map.of("status", "withdrawn"));
        }

        return ApiResponse.ok(Map.of("status", "exists"));
    }

    /**
     * 비밀번호 변경 요청 DTO
     */
    @lombok.Getter
    @lombok.NoArgsConstructor
    public static class ChangePasswordRequest {
        @jakarta.validation.constraints.NotBlank(message = "현재 비밀번호를 입력해주세요.")
        private String currentPassword;

        @jakarta.validation.constraints.NotBlank(message = "새 비밀번호를 입력해주세요.")
        @jakarta.validation.constraints.Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다.")
        private String newPassword;
    }

    /**
     * 비밀번호 변경
     */
    @PutMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @jakarta.validation.Valid @RequestBody ChangePasswordRequest request,
            Principal principal) {

        if (principal == null) {
            throw new com.farmbalance.global.error.BusinessException(com.farmbalance.global.error.ErrorCode.ACCESS_DENIED);
        }

        String email = principal.getName();
        User user = getProfileUseCase.getProfile(email);

        // 현재 비밀번호 검증
        if (user.getPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new com.farmbalance.global.error.BusinessException(
                    com.farmbalance.global.error.ErrorCode.AUTH_INVALID_CREDENTIALS, "현재 비밀번호가 올바르지 않습니다.");
        }

        // 새 비밀번호 암호화 후 저장
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        updateProfileUseCase.changePassword(email, encodedPassword);

        log.info("비밀번호 변경 완료: email={}", email);
        return ApiResponse.ok(null);
    }

    /**
     * 회원 탈퇴 요청 DTO
     * - LOCAL 유저: password 필수
     * - SOCIAL 유저: password 없이 탈퇴 가능
     */
    @lombok.Getter
    @lombok.NoArgsConstructor
    public static class DeleteAccountRequest {
        private String password;
    }

    /**
     * 회원 탈퇴 (Soft Delete → WITHDRAWN 상태로 변경)
     */
    @DeleteMapping("/me")
    public ApiResponse<Void> deleteAccount(
            @RequestBody DeleteAccountRequest request,
            Principal principal) {

        if (principal == null) {
            throw new com.farmbalance.global.error.BusinessException(com.farmbalance.global.error.ErrorCode.ACCESS_DENIED);
        }

        String email = principal.getName();
        User user = getProfileUseCase.getProfile(email);

        // LOCAL 유저인 경우 비밀번호 검증 필수
        if (user.getProvider() == com.farmbalance.user.domain.AuthProvider.LOCAL) {
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new com.farmbalance.global.error.BusinessException(
                        com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "비밀번호를 입력해주세요.");
            }
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new com.farmbalance.global.error.BusinessException(
                        com.farmbalance.global.error.ErrorCode.AUTH_INVALID_CREDENTIALS, "비밀번호가 올바르지 않습니다.");
            }
        }

        updateProfileUseCase.withdrawAccount(email);
        log.info("회원 탈퇴 완료 (WITHDRAWN): email={}", email);
        return ApiResponse.ok(null);
    }

    /**
     * 탈퇴 계정 재활성화
     */
    @PostMapping("/reactivate")
    public ApiResponse<Void> reactivateAccount(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            throw new com.farmbalance.global.error.BusinessException(
                    com.farmbalance.global.error.ErrorCode.VALIDATION_ERROR, "이메일을 입력해주세요.");
        }

        updateProfileUseCase.reactivateAccount(email);
        log.info("계정 재활성화 완료: email={}", email);
        return ApiResponse.ok(null);
    }
}
