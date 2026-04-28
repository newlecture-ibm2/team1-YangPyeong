package com.farmbalance.farm.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "farms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FarmJpaEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserJpaEntity user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false)
    private Double area;

    @Column(name = "crop_type", length = 50)
    private String cropType;

    @Column(name = "bjd_code", length = 10)
    private String bjdCode;

    @Column(name = "pnu_code", length = 19)
    private String pnuCode;

    @Builder
    public FarmJpaEntity(UserJpaEntity user, String name, String address, Double area, String cropType, String bjdCode, String pnuCode) {
        this.user = user;
        this.name = name;
        this.address = address;
        this.area = area;
        this.cropType = cropType;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
    }
}
