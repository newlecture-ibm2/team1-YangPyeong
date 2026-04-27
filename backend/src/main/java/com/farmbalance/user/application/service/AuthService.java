package com.farmbalance.user.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.security.JwtTokenProvider;
import com.farmbalance.user.adapter.in.web.dto.*;
import com.farmbalance.user.application.port.in.LoginUseCase;
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

/**
 * 인증 서비스 — UseCase 구현체 (Application Layer)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService implements LoginUseCase, SignUpUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_SUSPENDED);
        }

        String accessToken = jwtTokenProvider.createAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

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

        Role role = Role.USER;
        if (request.getRole() != null) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.USER_INVALID_ROLE);
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
}
