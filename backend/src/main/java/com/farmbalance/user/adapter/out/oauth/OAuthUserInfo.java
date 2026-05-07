package com.farmbalance.user.adapter.out.oauth;

import lombok.Builder;
import lombok.Getter;

/**
 * 소셜 로그인 제공자로부터 받은 사용자 정보
 */
@Getter
@Builder
public class OAuthUserInfo {
    private String providerId;
    private String email;
    private String name;
    private String profileImageUrl;
}
