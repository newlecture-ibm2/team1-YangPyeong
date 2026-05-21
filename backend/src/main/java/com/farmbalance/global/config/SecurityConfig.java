package com.farmbalance.global.config;

import com.farmbalance.global.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 설정
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // ── 인증 관련 (공개) ──
                .requestMatchers("/api/auth/**").permitAll()

                // ── Swagger / OpenAPI (공개) ──
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**").permitAll()

                // ── 헬스체크 (공개) ──
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()

                // ── 공개 조회 API (GET only) ──
                .requestMatchers(HttpMethod.GET, "/api/balance/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/recommend/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/community/posts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/community/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/shop/products/**", "/api/shop/category").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/policies/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/weather/**").permitAll()

                // ── AI 내부 API (JWT 불필요, 컨트롤러에서 X-AI-Internal-Key 검증) ──
                .requestMatchers("/api/internal/**").permitAll()

                // ── 작물 마스터 조회 (일반 사용자 농장등록/재배등록에서 사용) ──
                .requestMatchers(HttpMethod.GET, "/api/admin/crops", "/api/admin/crops/categories").permitAll()

                // ── 관리자 전용 (위 GET 예외 외 나머지) ──
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ── 지자체 전용 ──
                .requestMatchers("/api/gov/**").hasAnyRole("GOV", "ADMIN")

                // ── 나머지: 인증 필수 ──
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
