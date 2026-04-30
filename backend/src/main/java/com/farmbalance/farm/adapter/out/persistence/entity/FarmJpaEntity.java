package com.farmbalance.farm.adapter.out.persistence.entity;

import com.farmbalance.global.entity.BaseTimeEntity;
import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

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

    @Column(name = "bjd_code", length = 10)
    private String bjdCode;

    @Column(name = "pnu_code", length = 19)
    private String pnuCode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "area", nullable = false)
    private Double area;

    @Column(name = "soil_type", length = 50)
    private String soilType;

    @Column(name = "business_number", length = 12)
    private String registrationNumber;

    @Column(name = "land_cert_image_url", length = 500)
    private String documentUrl;

    @Column(name = "land_cert_verified")
    private Boolean landCertVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "certification_status", nullable = false, length = 20)
    private com.farmbalance.farm.domain.CertificationStatus certificationStatus = com.farmbalance.farm.domain.CertificationStatus.PENDING;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "farm_crops", joinColumns = @JoinColumn(name = "farm_id"))
    @Column(name = "crop_name")
    private List<String> cropTypes = new ArrayList<>();

    @Builder
    public FarmJpaEntity(UserJpaEntity user, String name, String address, Double area,
                         List<String> cropTypes, String bjdCode, String pnuCode,
                         Double latitude, Double longitude, String registrationNumber,
                         String documentUrl, String soilType,
                         com.farmbalance.farm.domain.CertificationStatus certificationStatus) {
        this.user = user;
        this.name = name;
        this.address = address;
        this.area = area;
        this.cropTypes = cropTypes;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.registrationNumber = registrationNumber;
        this.documentUrl = documentUrl;
        this.soilType = soilType;
        this.certificationStatus = certificationStatus != null ? certificationStatus : com.farmbalance.farm.domain.CertificationStatus.PENDING;
    }

    public void update(String name, String address, Double area, List<String> cropTypes,
                       String bjdCode, String pnuCode, Double latitude, Double longitude,
                       String registrationNumber, String documentUrl) {
        this.name = name;
        this.address = address;
        this.area = area;
        this.cropTypes = cropTypes;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.registrationNumber = registrationNumber;
        this.documentUrl = documentUrl;
    }
}
