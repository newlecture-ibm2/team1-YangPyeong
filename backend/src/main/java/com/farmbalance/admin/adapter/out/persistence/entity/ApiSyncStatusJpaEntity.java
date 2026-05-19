package com.farmbalance.admin.adapter.out.persistence.entity;

import com.farmbalance.admin.domain.ApiSyncStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * API 동기화 상태 JPA 엔티티 (Driven Adapter)
 * domain.ApiSyncStatus ↔ ApiSyncStatusJpaEntity 변환을 담당합니다.
 *
 * <p>
 * ERD 2.32 api_sync_status 테이블에 대응
 * </p>
 */
@Entity
@Table(name = "api_sync_status")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ApiSyncStatusJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String apiName;

    @Column(nullable = false, length = 100)
    private String displayName;

    private LocalDateTime lastSynced;
    
    private LocalDateTime lastHealthChecked;

    @Column(length = 100)
    @Builder.Default
    private String syncStatus = "PENDING";

    private Integer lastRecordCount;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    public void updateActiveStatus(boolean isActive) {
        this.isActive = isActive;
    }

    public void updateAll(LocalDateTime lastSynced, LocalDateTime lastHealthChecked, String syncStatus, Integer count, String error) {
        this.lastSynced = lastSynced;
        this.lastHealthChecked = lastHealthChecked;
        this.syncStatus = syncStatus;
        this.lastRecordCount = count;
        this.errorMessage = error;
    }

    /* ── 도메인 모델 변환 ── */

    public ApiSyncStatus toDomain() {
        return ApiSyncStatus.builder()
                .id(id)
                .apiName(apiName)
                .displayName(displayName)
                .lastSynced(lastSynced)
                .lastHealthChecked(lastHealthChecked)
                .syncStatus(syncStatus)
                .lastRecordCount(lastRecordCount)
                .errorMessage(errorMessage)
                .isActive(isActive)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .deletedAt(deletedAt)
                .build();
    }

    public static ApiSyncStatusJpaEntity fromDomain(ApiSyncStatus domain) {
        return ApiSyncStatusJpaEntity.builder()
                .id(domain.getId())
                .apiName(domain.getApiName())
                .displayName(domain.getDisplayName())
                .lastSynced(domain.getLastSynced())
                .lastHealthChecked(domain.getLastHealthChecked())
                .syncStatus(domain.getSyncStatus())
                .lastRecordCount(domain.getLastRecordCount())
                .errorMessage(domain.getErrorMessage())
                .isActive(domain.getIsActive())
                .build();
    }
}
