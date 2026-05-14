package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.security.JwtTokenProvider;
import com.farmbalance.global.security.LoginAttemptStore;
import com.farmbalance.global.security.RefreshTokenStore;
import com.farmbalance.user.adapter.out.oauth.GoogleOAuthClient;
import com.farmbalance.user.adapter.out.oauth.KakaoOAuthClient;
import com.farmbalance.user.adapter.out.oauth.OAuthUserInfo;
import com.farmbalance.user.application.port.in.*;
import com.farmbalance.user.application.port.out.SecurityQuestionRepository;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.application.port.out.UserSocialAccountRepository;
import com.farmbalance.user.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 서비스 — UseCase 구현체 (Application Layer)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService implements LoginUseCase, SignUpUseCase, RefreshTokenUseCase, LogoutUseCase, SocialLoginUseCase {

    private final UserRepository userRepository;
    private final UserSocialAccountRepository socialAccountRepository;
    private final SecurityQuestionRepository securityQuestionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenStore refreshTokenStore;
    private final LoginAttemptStore loginAttemptStore;
    private final KakaoOAuthClient kakaoOAuthClient;
    private final GoogleOAuthClient googleOAuthClient;

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
                || user.getPassword() == null
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
        validateUserStatus(user);

        // ── 4. 로그인 성공 → 시도 횟수 초기화 ──
        loginAttemptStore.resetAttempts(email);

        // ── 5. 토큰 발급 ──
        log.info("로그인 성공: userId={}, email={}", user.getId(), user.getEmail());
        return issueTokens(user);
    }

    @Override
    @Transactional
    public SignUpResponse signUp(SignUpRequest request) {
        // 이메일 중복 검사: WITHDRAWN(탈퇴 완료)만 재가입 시 기존 행 삭제.
        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            if (existingUser.getStatus() == UserStatus.WITHDRAWN) {
                // 탈퇴 계정의 보안질문 및 유저 레코드 삭제 후 새로 생성 (unique constraint 충돌 방지)
                securityQuestionRepository.deleteByUserId(existingUser.getId());
                userRepository.deleteByEmail(existingUser.getEmail());
            } else {
                throw new BusinessException(ErrorCode.USER_EMAIL_DUPLICATE);
            }
        });

        // 회원가입은 항상 USER/ACTIVE
        // - FARMER: USER 가입 후 조건 충족 시 자동 승격
        // - GOV: 관리자가 메일 문의 기반으로 계정 생성 후 메일 안내
        // - ADMIN: 내부 부여
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(Role.USER)
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .build();

        User saved = userRepository.save(user);

        // 보안질문 저장 (답변은 정규화 후 BCrypt 해시)
        if (request.getSecurityQuestion() != null && request.getSecurityAnswer() != null) {
            String normalizedAnswer = request.getSecurityAnswer().trim().toLowerCase();
            SecurityQuestion securityQuestion = SecurityQuestion.builder()
                    .userId(saved.getId())
                    .question(request.getSecurityQuestion())
                    .answer(passwordEncoder.encode(normalizedAnswer))
                    .build();
            securityQuestionRepository.save(securityQuestion);
        }

        log.info("회원가입 완료: userId={}, email={}", saved.getId(), saved.getEmail());

        return new SignUpResponse(saved.getId());
    }

    @Override
    @Transactional
    public TokenResponse socialLogin(SocialLoginRequest request) {
        // 1. provider 파싱
        AuthProvider provider;
        try {
            provider = AuthProvider.valueOf(request.getProvider().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED,
                    "지원하지 않는 소셜 로그인 제공자입니다: " + request.getProvider());
        }

        if (provider == AuthProvider.LOCAL) {
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED,
                    "LOCAL은 소셜 로그인 제공자가 아닙니다.");
        }

        // 2. 소셜 API에서 사용자 정보 조회
        OAuthUserInfo userInfo = fetchOAuthUserInfo(provider, request.getAccessToken());

        // 3. 이메일 필수 확인 (카카오는 이메일이 없을 수 있음)
        if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_EMAIL_REQUIRED);
        }

        // 4. 소셜 연동 테이블에서 먼저 조회
        User user = socialAccountRepository.findByProviderAndProviderId(provider, userInfo.getProviderId())
                .map(socialAccount -> userRepository.findById(socialAccount.getUserId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)))
                .orElseGet(() -> findOrCreateAndLinkSocialUser(provider, userInfo));

        // 5. 계정 상태 검사
        validateUserStatus(user);

        // 6. 토큰 발급
        log.info("소셜 로그인 성공: userId={}, provider={}, email={}", user.getId(), provider, user.getEmail());
        return issueTokens(user);
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

        validateUserStatus(user);

        // 5. 새 토큰 쌍 발급 (Rotation)
        refreshTokenStore.delete(userId);
        log.info("토큰 갱신 성공: userId={}", userId);
        return issueTokens(user);
    }

    @Override
    public void logout(Long userId) {
        refreshTokenStore.delete(userId);
        log.info("로그아웃 완료: userId={}", userId);
    }

    // ── Private Helper 메서드 ──

    /** JWT 토큰 쌍 발급 (공통) */
    private TokenResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), user.getName()
        );
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        refreshTokenStore.save(user.getId(), refreshToken,
                jwtTokenProvider.getRefreshTokenExpiration());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /** 계정 상태 검사 (공통) */
    private void validateUserStatus(User user) {
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.USER_WITHDRAWN,
                    "WITHDRAWN:" + user.getEmail());
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_SUSPENDED);
        }
        if (user.getStatus() == UserStatus.PENDING) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_PENDING);
        }
    }

    /** 소셜 제공자별 사용자 정보 조회 */
    private OAuthUserInfo fetchOAuthUserInfo(AuthProvider provider, String accessToken) {
        return switch (provider) {
            case KAKAO -> kakaoOAuthClient.getUserInfo(accessToken);
            case GOOGLE -> googleOAuthClient.getUserInfo(accessToken);
            default -> throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED);
        };
    }

    /**
     * 이메일로 기존 계정을 찾거나 신규 생성한 후, 소셜 연동 정보를 저장합니다.
     * - 같은 이메일의 기존 계정이 있으면 → 소셜 연동 추가 (카카오+구글 동시 가능)
     * - 없으면 → 새 계정 생성 + 소셜 연동
     */
    private User findOrCreateAndLinkSocialUser(AuthProvider provider, OAuthUserInfo userInfo) {
        User user = userRepository.findByEmail(userInfo.getEmail())
                .orElseGet(() -> {
                    // 신규 소셜 사용자 생성
                    User newUser = User.builder()
                            .email(userInfo.getEmail())
                            .password(null)
                            .name(userInfo.getName() != null ? userInfo.getName() : "소셜사용자")
                            .role(Role.USER)
                            .status(UserStatus.ACTIVE)
                            .provider(provider)
                            .providerId(userInfo.getProviderId())
                            .profileImageUrl(userInfo.getProfileImageUrl())
                            .build();
                    return userRepository.save(newUser);
                });

        // 소셜 연동 정보 저장 (이미 연동되어 있지 않은 경우에만)
        if (!socialAccountRepository.existsByUserIdAndProvider(user.getId(), provider)) {
            UserSocialAccount socialAccount = UserSocialAccount.builder()
                    .userId(user.getId())
                    .provider(provider)
                    .providerId(userInfo.getProviderId())
                    .build();
            socialAccountRepository.save(socialAccount);
            log.info("소셜 연동 추가: userId={}, provider={}", user.getId(), provider);
        }

        return user;
    }
}
