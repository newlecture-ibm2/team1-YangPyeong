package com.farmbalance.user.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 사용자 약관 동의 도메인 모델
 */
@Getter
@Builder
public class UserAgreement {
    private final Long id;
    private final Long userId;
    private final AgreementType agreementType;
    private final String version;
    private final boolean isAgreed;
    private final LocalDateTime agreedAt;

    public enum AgreementType {
        TERMS_OF_SERVICE,   // 서비스 이용약관
        PRIVACY_POLICY,     // 개인정보 처리방침
        MARKETING           // 마케팅 정보 수신
    }
}
