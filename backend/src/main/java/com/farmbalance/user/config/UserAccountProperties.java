package com.farmbalance.user.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 계정 탈퇴·비식별화 관련 설정 (application.yml app.user)
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.user")
public class UserAccountProperties {

    /** 탈퇴 후 복구 가능 + 비식별화까지 대기 일수 (기본 30일) */
    private int anonymizationGraceDays = 30;

    /** 전자상거래법 거래 기록 보존 의무 일수 (기본 5년 = 1825일) */
    private int ecommerceRetentionDays = 1825;
}
