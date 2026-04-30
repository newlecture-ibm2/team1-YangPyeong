package com.farmbalance.history.adapter.out.persistence.repository;

import com.farmbalance.history.adapter.out.persistence.entity.HistoryJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoryJpaRepository extends JpaRepository<HistoryJpaEntity, Long> {
    List<HistoryJpaEntity> findByFarmIdOrderByCreatedAtDesc(Long farmId);
}
