package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자용 사용자 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-001 사용자 관리: 목록 조회, 역할 변경, 정지/재활성화
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminUser {

    private Long id;
    private String email;
    private String name;
    private String phone;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
