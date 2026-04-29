package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 정책 데이터 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-012 정책 데이터 관리: 지자체 농업 지원 정책 DB 등록/갱신
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminPolicyData {

    private Long id;
    private String externalId;
    private String data;
    private LocalDateTime fetchedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
