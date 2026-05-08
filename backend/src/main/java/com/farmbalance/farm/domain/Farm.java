package com.farmbalance.farm.domain;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

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
    private List<FarmDocument> documents; // 제출 서류 목록
    private FarmDocumentData documentData; // 서류에서 추출한 데이터
    private String soilType;
    private Double ph;
    private Double organicMatter;
    private CertificationStatus certificationStatus; // 인증 상태
    private String rejectReason; // 반려 사유
    private java.time.LocalDateTime createdAt; // 생성일시
    private FarmStatus status; // 운영 상태 (OPERATING, FALLOW, CLOSED)

    public void updateCertificationStatus(CertificationStatus status) {
        this.certificationStatus = status;
    }

    public void updateInfo(String name, String address, Double area, List<Long> cropIds,
                           String bjdCode, String pnuCode, Double latitude, Double longitude, 
                           List<FarmDocument> documents, FarmDocumentData documentData,
                           String soilType, Double ph, Double organicMatter) {
        this.name = name;
        this.address = address;
        this.area = area;
        this.cropIds = cropIds;
        this.bjdCode = bjdCode;
        this.pnuCode = pnuCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.documents = documents;
        this.documentData = documentData;
        this.soilType = soilType;
        this.ph = ph;
        this.organicMatter = organicMatter;
        
        // 반려된 상태에서 수정하면 다시 심사 대기 상태로 변경
        if (this.certificationStatus == CertificationStatus.REJECTED) {
            this.certificationStatus = CertificationStatus.PENDING;
            this.rejectReason = null;
        }
    }

    /**
     * 재배 등록 가능 여부 검증 (운영 상태 및 면적)
     * @param requestedArea 추가 요청 면적
     * @param currentUsedArea 현재 사용 중인 총 면적
     */
    public void validateCultivationArea(BigDecimal requestedArea, BigDecimal currentUsedArea) {
        // 1. 농장 운영 상태 확인 (가드 로직)
        if (this.status != FarmStatus.OPERATING) {
            throw new BusinessException(ErrorCode.FARM_NOT_OPERATING);
        }

        // 2. 입력값 null 처리 및 기본값 설정
        BigDecimal req = (requestedArea != null) ? requestedArea : BigDecimal.ZERO;
        BigDecimal used = (currentUsedArea != null) ? currentUsedArea : BigDecimal.ZERO;

        // 3. 정밀 계산 (농장 전체 면적을 소수점 둘째 자리까지 반올림)
        BigDecimal totalLimit = BigDecimal.valueOf(this.area).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal afterAddition = used.add(req).setScale(2, java.math.RoundingMode.HALF_UP);

        // 4. 면적 초과 여부 검증
        if (afterAddition.compareTo(totalLimit) > 0) {
            BigDecimal available = totalLimit.subtract(used);
            throw new BusinessException(
                    ErrorCode.FARM_AREA_EXCEEDED,
                    String.format("가용 면적이 부족합니다. (농장 전체: %.2f㎡, 이미 사용중: %.2f㎡, 남은 면적: %.2f㎡, 요청 면적: %.2f㎡)",
                            totalLimit.doubleValue(), used.doubleValue(), available.doubleValue(), req.doubleValue())
            );
        }
    }
}
