package com.farmbalance.recommend.application.port.out;

import java.util.Optional;

/**
 * 추천 엔진이 필요한 최소 농장 정보 조회 포트
 * 
 * LoadFarmPort 대신 사용하여 Hibernate 의존성을 제거하고
 * 추천에 필요한 필드만 경량으로 조회합니다.
 */
public interface LoadFarmForRecommendPort {

    /**
     * 추천에 필요한 농장 기본 정보를 조회합니다.
     */
    Optional<FarmBasicData> loadFarmBasic(Long farmId);

    /**
     * 해당 농장이 특정 사용자의 소유인지 확인합니다.
     */
    boolean isOwnedBy(Long farmId, Long userId);

    /**
     * 추천용 경량 농장 데이터
     */
    interface FarmBasicData {
        Long getId();
        String getName();
        String getAddress();
        Double getArea();
        String getBjdCode();
        String getPnuCode();
        String getSoilType();
        Double getPh();
        Double getOrganicMatter();
    }
}
