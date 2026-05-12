package com.farmbalance.policy.adapter.out.persistence.repository;

import com.farmbalance.policy.adapter.out.persistence.entity.BatchLogJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatchLogRepository extends JpaRepository<BatchLogJpaEntity, Long> {
}
