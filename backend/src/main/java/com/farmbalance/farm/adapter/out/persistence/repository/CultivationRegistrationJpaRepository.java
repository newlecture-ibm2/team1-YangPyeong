package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.CultivationRegistrationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 재배 등록 JPA Repository
 */
public interface CultivationRegistrationJpaRepository extends JpaRepository<CultivationRegistrationJpaEntity, Long> {

    List<CultivationRegistrationJpaEntity> findByFarmIdAndDeletedAtIsNull(Long farmId);

    void deleteByFarmId(Long farmId);
}
