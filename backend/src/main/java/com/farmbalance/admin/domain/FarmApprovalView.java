package com.farmbalance.admin.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 농장 승인 요청 뷰 모델 (순수 Java — Framework 의존성 없음)
 * farms 테이블 + users 테이블 JOIN 결과를 담는 읽기 전용 도메인 객체
 */
@Getter
@Builder
@AllArgsConstructor
public class FarmApprovalView {

    // ── 농장 정보 ──
    private Long farmId;
    private String farmName;
    private String address;
    private BigDecimal areaSize;
    private String businessNumber;
    private String landCertImageUrl;
    private Boolean landCertVerified;
    private String status;
    private LocalDateTime createdAt;

    // ── 신청자 정보 ──
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
}
