package com.farmbalance.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT 인증 필터
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null) {
            try {
                var claims = jwtTokenProvider.validateAndGetClaims(token);
                Long userId = jwtTokenProvider.getUserId(claims);
                String role = jwtTokenProvider.getRole(claims);

                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                log.debug("JWT 인증 실패: {}", e.getMessage());
            }
        } else {
            // 개발서버/로컬 테스트용: 드롭다운으로 전달되는 X-USER-ID 헤더 처리
            String testUserId = request.getHeader("X-USER-ID");
            if (StringUtils.hasText(testUserId)) {
                try {
                    Long userId = Long.valueOf(testUserId);
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_GOV"));
                    var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("테스트용 X-USER-ID 기반 GOV 인증 설정 완료: {}", userId);
                } catch (Exception e) {
                    log.debug("테스트 X-USER-ID 인증 실패: {}", e.getMessage());
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
