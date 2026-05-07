package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.CultivationRegistrationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 재배 등록 JPA Repository
 */
public interface CultivationRegistrationJpaRepository extends JpaRepository<CultivationRegistrationJpaEntity, Long> {

    List<CultivationRegistrationJpaEntity> findByFarmIdAndDeletedAtIsNull(Long farmId);

    void deleteByFarmId(Long farmId);

    /**
     * 특정 농장의 ACTIVE 상태 재배 구역 면적 합계를 조회합니다.
     * COALESCE를 사용하여 등록된 구역이 없을 때 0.0을 반환합니다.
     */
    @Query("SELECT COALESCE(SUM(c.cultivationArea), 0.0) FROM CultivationRegistrationJpaEntity c " +
           "WHERE c.farmId = :farmId AND c.status = com.farmbalance.farm.domain.CultivationStatus.ACTIVE " +
           "AND c.deletedAt IS NULL")
    Double sumActiveAreaByFarmId(@Param("farmId") Long farmId);

    /**
     * 특정 재배 등록을 제외한 ACTIVE 상태 재배 구역 면적 합계를 조회합니다.
     * 수정 시 본인의 기존 면적을 제외하고 합산하기 위해 사용합니다.
     */
    @Query("SELECT COALESCE(SUM(c.cultivationArea), 0.0) FROM CultivationRegistrationJpaEntity c " +
           "WHERE c.farmId = :farmId AND c.status = com.farmbalance.farm.domain.CultivationStatus.ACTIVE " +
           "AND c.deletedAt IS NULL AND c.id <> :excludeId")
    Double sumActiveAreaByFarmIdExcluding(@Param("farmId") Long farmId, @Param("excludeId") Long excludeId);
}
