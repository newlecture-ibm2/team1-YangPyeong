package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.HarvestRecordJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 수확 이력 JPA Repository
 */
public interface HarvestRecordJpaRepository extends JpaRepository<HarvestRecordJpaEntity, Long> {

    List<HarvestRecordJpaEntity> findByCultivationRegistrationIdOrderByHarvestDateDesc(Long cultivationRegistrationId);
}
