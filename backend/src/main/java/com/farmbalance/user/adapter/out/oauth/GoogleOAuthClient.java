package com.farmbalance.user.adapter.out.oauth;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

import java.util.Map;

/**
 * 구글 OAuth API 클라이언트
 * 구글 액세스토큰으로 사용자 정보를 조회합니다.
 */
@Slf4j
@Component
public class GoogleOAuthClient {

    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    private final RestClient restClient = RestClient.create();

    @Retry(name = "oauthRetry")
    @CircuitBreaker(name = "oauthCircuitBreaker")
    public OAuthUserInfo getUserInfo(String accessToken) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri(USER_INFO_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED, "구글 사용자 정보를 가져올 수 없습니다.");
            }

            String providerId = (String) response.get("id");
            String email = (String) response.get("email");
            String name = (String) response.get("name");
            String profileImage = (String) response.get("picture");

            log.debug("구글 사용자 정보 조회 성공: providerId={}, email={}", providerId, email);

            return OAuthUserInfo.builder()
                    .providerId(providerId)
                    .email(email)
                    .name(name != null ? name : "구글사용자")
                    .profileImageUrl(profileImage)
                    .build();

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("구글 사용자 정보 조회 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_SOCIAL_LOGIN_FAILED, "구글 인증에 실패했습니다.");
        }
    }
}
