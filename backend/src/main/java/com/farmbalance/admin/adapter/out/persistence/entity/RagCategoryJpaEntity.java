package com.farmbalance.admin.adapter.out.persistence.entity;

import com.farmbalance.admin.domain.RagCategory;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * RAG 카테고리 JPA 엔티티 (Driven Adapter)
 * domain.RagCategory ↔ RagCategoryJpaEntity 변환을 담당합니다.
 *
 * <p>
 * ERD 2.24 rag_categories 테이블에 대응
 * </p>
 */
@Entity
@Table(name = "rag_categories")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RagCategoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 200)
    private String description;

    @Column
    @Builder.Default
    private Integer displayOrder = 0;

    @Column
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    /* ── 도메인 모델 변환 ── */

    public RagCategory toDomain() {
        return RagCategory.builder()
                .id(id)
                .name(name)
                .description(description)
                .displayOrder(displayOrder)
                .isActive(isActive)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .deletedAt(deletedAt)
                .build();
    }

    public static RagCategoryJpaEntity fromDomain(RagCategory category) {
        return RagCategoryJpaEntity.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .build();
    }
}
