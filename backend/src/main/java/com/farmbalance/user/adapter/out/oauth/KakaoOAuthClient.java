package com.farmbalance.user.adapter.out.oauth;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * 카카오 OAuth API 클라이언트
 * 카카오 액세스토큰으로 사용자 정보를 조회합니다.
 */
@Slf4j
@Component
public class KakaoOAuthClient {

    private static final String USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

    private final RestClient restClient = RestClient.create();

    @Retry(name = "oauthRetry")
    @CircuitBreaker(name = "oauthCircuitBreaker")
    public OAuthUserInfo getUserInfo(String accessToken) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri(USER_INFO_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED, "카카오 사용자 정보를 가져올 수 없습니다.");
            }

            String providerId = String.valueOf(response.get("id"));

            @SuppressWarnings("unchecked")
            Map<String, Object> kakaoAccount = (Map<String, Object>) response.get("kakao_account");

            String email = null;
            String name = "카카오사용자";
            String profileImage = null;

            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");

                @SuppressWarnings("unchecked")
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    name = (String) profile.getOrDefault("nickname", "카카오사용자");
                    profileImage = (String) profile.get("profile_image_url");
                }
            }

            log.debug("카카오 사용자 정보 조회 성공: providerId={}, email={}", providerId, email);

            return OAuthUserInfo.builder()
                    .providerId(providerId)
                    .email(email)
                    .name(name)
                    .profileImageUrl(profileImage)
                    .build();

        } catch (BusinessException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("카카오 API 통신 에러 (Resilience4j가 재시도할 예정): {}", e.getMessage());
            throw e; // Resilience4j 처리를 위해 그대로 던짐
        } catch (Exception e) {
            log.error("카카오 사용자 정보 조회 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED, "카카오 인증에 실패했습니다.");
        }
    }
}
