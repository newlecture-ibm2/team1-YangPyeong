package com.farmbalance.farm.adapter.out.persistence.entity;

import com.farmbalance.farm.domain.FarmStatus;
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

    @Column(name = "bjd_code", length = 10)
    private String bjdCode;

    @Column(name = "pnu_code", length = 19)
    private String pnuCode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "area")
    private Double area;

    @Column(name = "soil_type", length = 50)
    private String soilType;

    @Column(name = "soil_ph")
    private Double ph;

    @Column(name = "soil_organic_matter")
    private Double organicMatter;

    @Column(name = "documents", columnDefinition = "jsonb")
    @Convert(converter = com.farmbalance.farm.adapter.out.persistence.converter.FarmDocumentsConverter.class)
    private java.util.List<com.farmbalance.farm.domain.FarmDocument> documents = new java.util.ArrayList<>();

    @Column(name = "document_data", columnDefinition = "jsonb")
    @Convert(converter = com.farmbalance.farm.adapter.out.persistence.converter.FarmDocumentDataConverter.class)
    private com.farmbalance.farm.domain.FarmDocumentData documentData;

    @Enumerated(EnumType.STRING)
    @Column(name = "certification_status", nullable = false, length = 20)
    private com.farmbalance.farm.domain.CertificationStatus certificationStatus = com.farmbalance.farm.domain.CertificationStatus.PENDING;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FarmStatus status = FarmStatus.OPERATING;

    // cropTypes는 farm_crops 테이블로 관리 (JPA @ElementCollection 제거)

    @Builder
    public FarmJpaEntity(UserJpaEntity user, String name, String address, Double area,
                         String bjdCode, String pnuCode,
                         Double latitude, Double longitude, 
                         java.util.List<com.farmbalance.farm.domain.FarmDocument> documents,
                         com.farmbalance.farm.domain.FarmDocumentData documentData,
                         String soilType, Double ph, Double organicMatter,
                         com.farmbalance.farm.domain.CertificationStatus certificationStatus,
                         FarmStatus status) {
        this.user = user;
        this.name = name;
        this.address = address;
        this.area = area;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.documents = documents != null ? documents : new java.util.ArrayList<>();
        this.documentData = documentData;
        this.soilType = soilType;
        this.ph = ph;
        this.organicMatter = organicMatter;
        this.certificationStatus = certificationStatus != null ? certificationStatus : com.farmbalance.farm.domain.CertificationStatus.PENDING;
        this.status = status != null ? status : FarmStatus.OPERATING;
    }

    public void update(String name, String address, Double area,
                       String bjdCode, String pnuCode, Double latitude, Double longitude,
                       java.util.List<com.farmbalance.farm.domain.FarmDocument> documents,
                       com.farmbalance.farm.domain.FarmDocumentData documentData,
                       String soilType, Double ph, Double organicMatter) {
        this.name = name;
        this.address = address;
        this.area = area;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.documents = documents != null ? documents : new java.util.ArrayList<>();
        this.documentData = documentData;
        this.soilType = soilType;
        this.ph = ph;
        this.organicMatter = organicMatter;
    }

    /** 인증 상태 변경 */
    public void updateCertificationStatus(com.farmbalance.farm.domain.CertificationStatus status) {
        this.certificationStatus = status;
    }

    /** 인증 상태 변경 + 반려 사유 저장 */
    public void updateCertificationStatusWithReason(com.farmbalance.farm.domain.CertificationStatus status, String reason) {
        this.certificationStatus = status;
        this.rejectReason = reason;
    }
}
