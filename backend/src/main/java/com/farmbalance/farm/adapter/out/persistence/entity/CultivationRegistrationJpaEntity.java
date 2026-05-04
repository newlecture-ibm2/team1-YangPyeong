package com.farmbalance.farm.adapter.out.persistence.entity;

import com.farmbalance.farm.domain.CultivationType;
import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cultivation_registrations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CultivationRegistrationJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "crop_id", nullable = false)
    private Long cropId;

    @Enumerated(EnumType.STRING)
    @Column(name = "cultivation_type", nullable = false, length = 20)
    private CultivationType cultivationType;

    @Column(name = "cultivation_area", nullable = false)
    private Double cultivationArea;

    @Column(name = "farmer_estimated_yield")
    private Double farmerEstimatedYield;

    @Column(name = "ai_predicted_yield")
    private Double aiPredictedYield;

    @Column(name = "yield_unit", length = 10)
    private String yieldUnit;

    @Column(nullable = false)
    private Boolean verified;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
