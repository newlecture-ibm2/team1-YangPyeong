package com.farmbalance.balance.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "crop_production_stats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CropProductionStatsJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "itm_nm", nullable = false, length = 50)
    private String itmNm;

    @Column(name = "region_code", nullable = false, length = 10)
    private String regionCode;

    @Column(name = "region_name", length = 20)
    private String regionName;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "cultivated_area")
    private Double cultivatedArea;

    @Column(name = "yield_per_10a")
    private Double yieldPer10a;

    @Column(name = "total_production")
    private Double totalProduction;

    @Column(name = "unit_nm", length = 10)
    private String unitNm;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    public CropProductionStatsJpaEntity(String itmNm, String regionCode, String regionName, Integer year,
                                        Double cultivatedArea, Double yieldPer10a, Double totalProduction, String unitNm) {
        this.itmNm = itmNm;
        this.regionCode = regionCode;
        this.regionName = regionName;
        this.year = year;
        this.cultivatedArea = cultivatedArea;
        this.yieldPer10a = yieldPer10a;
        this.totalProduction = totalProduction;
        this.unitNm = unitNm;
    }
}
