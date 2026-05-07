package com.farmbalance.global.security;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Security Context에서 현재 인증된 사용자 정보를 조회하는 유틸리티.
 *
 * <pre>
 * 사용 예시 (Service 계층):
 * {@code
 * Long currentUserId = SecurityUtil.getCurrentUserId();
 * String currentRole = SecurityUtil.getCurrentRole();
 * }
 * </pre>
 */
public final class SecurityUtil {

    private SecurityUtil() {
        // 유틸리티 클래스 — 인스턴스화 방지
    }

    /**
     * 현재 로그인한 사용자의 ID를 반환합니다.
     * JwtAuthenticationFilter에서 principal을 userId(Long)으로 설정합니다.
     * @throws BusinessException 인증되지 않은 경우
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID, "인증 정보가 없습니다.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID, "사용자 ID를 확인할 수 없습니다.");
    }

    /**
     * 현재 로그인한 사용자의 이메일을 반환합니다.
     * JwtAuthenticationFilter에서 details에 email을 저장합니다.
     * @throws BusinessException 인증되지 않은 경우
     */
    public static String getCurrentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID, "인증 정보가 없습니다.");
        }
        Object details = authentication.getDetails();
        if (details instanceof String) {
            return (String) details;
        }
        throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID, "이메일을 확인할 수 없습니다.");
    }

    /**
     * 현재 로그인한 사용자의 역할(ROLE_xxx에서 ROLE_ 제거)을 반환합니다.
     */
    public static String getCurrentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID, "인증 정보가 없습니다.");
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("USER");
    }
}
