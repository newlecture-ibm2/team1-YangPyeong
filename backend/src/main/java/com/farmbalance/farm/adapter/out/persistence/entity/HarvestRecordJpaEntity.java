package com.farmbalance.farm.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 수확 이력 JPA 엔티티 (harvest_records 테이블)
 * V14 마이그레이션에서 신규 추가됨
 */
@Entity
@Table(name = "harvest_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class HarvestRecordJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cultivation_registration_id", nullable = false)
    private Long cultivationRegistrationId;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "yield_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal yieldAmount;

    @Column(name = "yield_unit", nullable = false, length = 10)
    private String yieldUnit;

    /** 등급 (A | B | C) */
    @Column(name = "grade", length = 10)
    private String grade;

    /** 상점 등록 여부 */
    @Column(name = "to_shop")
    private Boolean toShop = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public HarvestRecordJpaEntity(Long cultivationRegistrationId, LocalDate harvestDate,
                                  BigDecimal yieldAmount, String yieldUnit,
                                  String grade, Boolean toShop) {
        this.cultivationRegistrationId = cultivationRegistrationId;
        this.harvestDate = harvestDate;
        this.yieldAmount = yieldAmount;
        this.yieldUnit = yieldUnit;
        this.grade = grade;
        this.toShop = toShop != null ? toShop : false;
    }
}
