package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.CultivationRegistrationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CultivationRegistrationRepository extends JpaRepository<CultivationRegistrationJpaEntity, Long> {
    List<CultivationRegistrationJpaEntity> findByFarmId(Long farmId);
}
