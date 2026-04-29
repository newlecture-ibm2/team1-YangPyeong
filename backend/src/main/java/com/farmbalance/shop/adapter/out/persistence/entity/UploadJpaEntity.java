package com.farmbalance.shop.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공통 업로드 JPA 엔티티 (다형성 테이블).
 * 모든 도메인의 파일 첨부 및 이미지 업로드를 통합 관리합니다.
 *
 * - entity_type: 용도 구분 (PRODUCT, FARM_CERT, POST 등)
 * - file_type: 파일 종류 구분 (IMAGE, DOCUMENT)
 */
@Entity
@Table(name = "uploads", indexes = {
        @Index(name = "idx_uploads_entity", columnList = "entity_type, entity_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UploadJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 용도 구분 (PRODUCT / FARM_CERT / SEED_RECEIPT / POST 등) */
    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    /** 대상 엔티티 PK */
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    /** 파일 종류 (IMAGE / DOCUMENT) */
    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType;

    /** 파일 URL */
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    /** 원본 파일명 */
    @Column(name = "original_name", length = 255)
    private String originalName;

    /** 표시 순서 (0 = 대표) */
    @Column(name = "display_order")
    private int displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public UploadJpaEntity(String entityType, Long entityId, String fileType,
                           String fileUrl, String originalName, int displayOrder) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.fileType = fileType;
        this.fileUrl = fileUrl;
        this.originalName = originalName;
        this.displayOrder = displayOrder;
        this.createdAt = LocalDateTime.now();
    }

    /** 이미지 업로드용 간편 생성자 (하위 호환) */
    public UploadJpaEntity(String entityType, Long entityId, String fileUrl, int displayOrder) {
        this(entityType, entityId, "IMAGE", fileUrl, null, displayOrder);
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
