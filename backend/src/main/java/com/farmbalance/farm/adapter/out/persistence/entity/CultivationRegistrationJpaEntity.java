package com.farmbalance.farm.adapter.out.persistence.entity;

import com.farmbalance.farm.domain.CultivationStatus;
import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 재배 등록 JPA 엔티티 (cultivation_registrations 테이블)
 * V14 마이그레이션에서 seed_registrations → cultivation_registrations로 변경됨
 */
@Entity
@Table(name = "cultivation_registrations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CultivationRegistrationJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "crop_id", nullable = false)
    private Long cropId;

    /** 재배 면적 (㎡) — V14에서 신규 추가 */
    @Column(name = "cultivation_area")
    private Double cultivationArea;

    /** 농가 예상 수확량 (kg) — V14에서 신규 추가 */
    @Column(name = "farmer_estimated_yield")
    private Double farmerEstimatedYield;

    /** 수확량 단위 (g | kg | ton) */
    @Column(name = "yield_unit", length = 10)
    private String yieldUnit;

    /** 소프트 삭제 */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** 재배 상태 (ACTIVE: 재배중, COMPLETED: 수확완료) */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CultivationStatus status = CultivationStatus.ACTIVE;

    @Builder
    public CultivationRegistrationJpaEntity(Long id, Long farmId, Long cropId,
                                            Double cultivationArea, Double farmerEstimatedYield,
                                            String yieldUnit, CultivationStatus status) {
        this.id = id;
        this.farmId = farmId;
        this.cropId = cropId;
        this.cultivationArea = cultivationArea;
        this.farmerEstimatedYield = farmerEstimatedYield;
        this.yieldUnit = yieldUnit;
        this.status = status != null ? status : CultivationStatus.ACTIVE;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void updateInfo(Long cropId, Double cultivationArea, Double farmerEstimatedYield, String yieldUnit) {
        if (cropId != null) {
            this.cropId = cropId;
        }
        this.cultivationArea = cultivationArea;
        this.farmerEstimatedYield = farmerEstimatedYield;
        this.yieldUnit = yieldUnit;
    }

    public void updateStatus(CultivationStatus status) {
        if (status != null) {
            this.status = status;
        }
    }
}
