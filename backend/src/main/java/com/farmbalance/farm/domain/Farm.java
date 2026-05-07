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
    private List<Long> cropIds;       // 입력용: farm_crops에 저장할 crop ID 목록
    private List<String> cropNames;   // 출력용: farm_crops JOIN crops에서 추출한 작물명
    private String bjdCode;
    private String pnuCode;
    private Double latitude;   // 위도
    private Double longitude;  // 경도
    private String registrationNumber; // 농업경영체 등록번호
    private String documentUrl; // 증빙 서류 이미지 경로
    private String soilType;
    private Double ph;
    private Double organicMatter;
    private CertificationStatus certificationStatus; // 인증 상태
    private FarmStatus status; // 운영 상태 (OPERATING, FALLOW, CLOSED)

    public void updateCertificationStatus(CertificationStatus status) {
        this.certificationStatus = status;
    }

    public void updateInfo(String name, String address, Double area, List<Long> cropIds,
                           String bjdCode, String pnuCode, Double latitude, Double longitude, 
                           String registrationNumber, String documentUrl,
                           String soilType, Double ph, Double organicMatter) {
        this.name = name;
        this.address = address;
        this.area = area;
        this.cropIds = cropIds;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.registrationNumber = registrationNumber;
        this.documentUrl = documentUrl;
        this.soilType = soilType;
        this.ph = ph;
        this.organicMatter = organicMatter;
    }
}
