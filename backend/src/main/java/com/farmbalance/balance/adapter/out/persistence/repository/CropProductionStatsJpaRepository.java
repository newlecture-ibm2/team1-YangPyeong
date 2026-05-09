package com.farmbalance.balance.adapter.out.persistence.repository;

import com.farmbalance.balance.adapter.out.persistence.entity.CropProductionStatsJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CropProductionStatsJpaRepository extends JpaRepository<CropProductionStatsJpaEntity, Long> {
    Optional<CropProductionStatsJpaEntity> findByItmNmAndYearAndRegionCodeAndDeletedAtIsNull(String itmNm, Integer year, String regionCode);
    Optional<CropProductionStatsJpaEntity> findByItmNmAndYearAndDeletedAtIsNull(String itmNm, Integer year);
    
    // 가장 최신 연도의 데이터 조회 (Fallback용)
    Optional<CropProductionStatsJpaEntity> findFirstByItmNmAndRegionCodeAndDeletedAtIsNullOrderByYearDesc(String itmNm, String regionCode);
    Optional<CropProductionStatsJpaEntity> findFirstByItmNmAndDeletedAtIsNullOrderByYearDesc(String itmNm);
}
