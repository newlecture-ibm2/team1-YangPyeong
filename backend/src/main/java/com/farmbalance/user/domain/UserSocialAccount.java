package com.farmbalance.user.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 소셜 계정 연동 도메인 모델 (순수 Java)
 * 한 명의 사용자가 여러 소셜 제공자를 연동할 수 있습니다.
 */
@Getter
@Builder
@AllArgsConstructor
public class UserSocialAccount {

    private Long id;
    private Long userId;
    private AuthProvider provider;
    private String providerId;
    private LocalDateTime linkedAt;
}
