package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.security.JwtTokenProvider;
import com.farmbalance.global.security.LoginAttemptStore;
import com.farmbalance.global.security.RefreshTokenStore;
import com.farmbalance.user.adapter.in.web.dto.*;
import com.farmbalance.user.application.port.in.LoginUseCase;
import com.farmbalance.user.application.port.in.LogoutUseCase;
import com.farmbalance.user.application.port.in.RefreshTokenUseCase;
import com.farmbalance.user.application.port.in.SignUpUseCase;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.Role;
import com.farmbalance.user.domain.User;
import com.farmbalance.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * 인증 서비스 — UseCase 구현체 (Application Layer)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService implements LoginUseCase, SignUpUseCase, RefreshTokenUseCase, LogoutUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenStore refreshTokenStore;
    private final LoginAttemptStore loginAttemptStore;

    /** 회원가입 시 허용되는 역할 (ADMIN/GOV는 관리자가 직접 부여) */
    private static final Set<Role> ALLOWED_SIGNUP_ROLES = Set.of(Role.USER, Role.FARMER);

    @Override
    public TokenResponse login(LoginRequest request) {
        String email = request.getEmail();

        // ── 1. 로그인 잠금 확인 ──
        if (loginAttemptStore.isLocked(email)) {
            long remainMinutes = loginAttemptStore.getLockRemainingMinutes(email);
            throw new BusinessException(ErrorCode.AUTH_LOGIN_LOCKED,
                    "로그인 5회 실패로 " + remainMinutes + "분간 잠금되었습니다. 비밀번호 찾기를 이용해주세요.");
        }

        // ── 2. 자격 증명 검증 (이메일 미존재도 동일 메시지 → 열거 공격 방지) ──
        User user = userRepository.findByEmail(email).orElse(null);

        boolean credentialsInvalid = (user == null)
                || !passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (credentialsInvalid) {
            loginAttemptStore.recordFailure(email);
            int remaining = loginAttemptStore.getRemainingAttempts(email);
            if (remaining <= 0) {
                throw new BusinessException(ErrorCode.AUTH_LOGIN_LOCKED,
                        "로그인 5회 실패로 30분간 잠금되었습니다. 비밀번호 찾기를 이용해주세요.");
            }
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "이메일 또는 비밀번호가 올바르지 않습니다. (남은 시도: " + remaining + "회)");
        }

        // ── 3. 계정 상태 검사 ──
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_SUSPENDED);
        }
        if (user.getStatus() == UserStatus.PENDING) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_PENDING);
        }

        // ── 4. 로그인 성공 → 시도 횟수 초기화 ──
        loginAttemptStore.resetAttempts(email);

        // ── 5. 토큰 발급 ──
        String accessToken = jwtTokenProvider.createAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        refreshTokenStore.save(user.getId(), refreshToken,
                jwtTokenProvider.getRefreshTokenExpiration());

        log.info("로그인 성공: userId={}, email={}", user.getId(), user.getEmail());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    @Transactional
    public SignUpResponse signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.USER_EMAIL_DUPLICATE);
        }

        // 역할 결정 (USER, FARMER만 허용 — ADMIN/GOV는 관리자 부여)
        Role role = Role.USER;
        if (request.getRole() != null) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.USER_INVALID_ROLE);
            }
            if (!ALLOWED_SIGNUP_ROLES.contains(role)) {
                throw new BusinessException(ErrorCode.USER_INVALID_ROLE,
                        "회원가입 시 선택 가능한 역할: USER, FARMER");
            }
        }

        UserStatus status = (role == Role.FARMER) ? UserStatus.PENDING : UserStatus.ACTIVE;

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(role)
                .status(status)
                .build();

        User saved = userRepository.save(user);
        log.info("회원가입 완료: userId={}, role={}, status={}", saved.getId(), role, status);

        return new SignUpResponse(saved.getId());
    }

    @Override
    public TokenResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        // 1. Refresh Token 유효성 검증 (서명 + 만료)
        if (!jwtTokenProvider.isValid(refreshToken)) {
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
        }

        // 2. 토큰에서 userId 추출
        Long userId = jwtTokenProvider.getUserId(refreshToken);

        // 3. Redis에 저장된 Refresh Token과 일치하는지 확인 (탈취 방지)
        String stored = refreshTokenStore.find(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID));

        if (!stored.equals(refreshToken)) {
            refreshTokenStore.delete(userId);
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
        }

        // 4. 사용자 조회 + 상태 검사 (정지된 사용자의 토큰 갱신 차단)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            refreshTokenStore.delete(userId);
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_SUSPENDED);
        }
        if (user.getStatus() == UserStatus.PENDING) {
            refreshTokenStore.delete(userId);
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_PENDING);
        }

        // 5. 새 토큰 쌍 발급 (Rotation)
        String newAccessToken = jwtTokenProvider.createAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        refreshTokenStore.save(userId, newRefreshToken,
                jwtTokenProvider.getRefreshTokenExpiration());

        log.info("토큰 갱신 성공: userId={}", userId);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    @Override
    public void logout(Long userId) {
        refreshTokenStore.delete(userId);
        log.info("로그아웃 완료: userId={}", userId);
    }
}
