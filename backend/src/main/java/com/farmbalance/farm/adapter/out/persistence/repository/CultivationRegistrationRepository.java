package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.CultivationRegistrationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CultivationRegistrationRepository extends JpaRepository<CultivationRegistrationJpaEntity, Long> {
    List<CultivationRegistrationJpaEntity> findByFarmId(Long farmId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE CultivationRegistrationJpaEntity c SET c.status = :status WHERE c.id = :id")
    void updateStatus(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("status") com.farmbalance.farm.domain.CultivationStatus status);
}
