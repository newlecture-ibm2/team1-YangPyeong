package com.farmbalance.admin.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * API 동기화 상태 도메인 모델 (순수 Java — Framework 의존성 없음)
 * ADM-004 외부 API 데이터 관리: 동기화 상태 모니터링, On/Off 제어
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiSyncStatus {

    private Long id;
    private String apiName;
    private String displayName;
    private LocalDateTime lastSynced;
    private LocalDateTime lastHealthChecked;
    private String syncStatus;       // PENDING, RUNNING, SUCCESS, FAILED
    private Integer lastRecordCount;
    private String errorMessage;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
