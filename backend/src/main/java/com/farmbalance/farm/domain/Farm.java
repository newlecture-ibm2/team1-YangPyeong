package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class Farm {
    private Long id;
    private Long userId;
    private String name;
    private String address;
    private Double area;
    private List<String> cropTypes;
    private String bjdCode;
    private String pnuCode;
    private Double latitude;   // 위도
    private Double longitude;  // 경도
    private String registrationNumber; // 농업경영체 등록번호
    private String documentUrl; // 증빙 서류 이미지 경로
    private CertificationStatus certificationStatus; // 인증 상태

    public void updateCertificationStatus(CertificationStatus status) {
        this.certificationStatus = status;
    }
}
