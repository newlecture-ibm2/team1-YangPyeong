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
                // 인증 관련
                .requestMatchers("/api/auth/**").permitAll()

                // Swagger / OpenAPI
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**").permitAll()

                // 공개 조회 API
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/balance/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/recommend/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/shop/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/policies/**").permitAll()

                // 관리자 / 지자체 (TODO: 운영 시 .hasRole("ADMIN") / .hasAnyRole("GOV","ADMIN") 복원)
                .requestMatchers("/api/admin/**").permitAll()
                .requestMatchers("/api/gov/**").permitAll()

                // 나머지: 개발 단계에서는 모든 요청 허용 (추후 .authenticated()로 변경)
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
