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

    /** 탈퇴 요청 후 최종 WITHDRAWN 처리까지 대기 일수 */
    private int withdrawalGraceDays = 7;

    /** 최종 탈퇴(updatedAt) 후 비식별화 스케줄 대상이 되기까지 일수 */
    private int anonymizationDaysAfterWithdrawal = 30;
}
