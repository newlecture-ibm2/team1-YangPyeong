package com.farmbalance.recommend.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FarmRevenuePredictionRepository extends JpaRepository<FarmRevenuePredictionEntity, Long> {

    List<FarmRevenuePredictionEntity> findByFarmIdOrderByPredictedAtDesc(Long farmId);

    Optional<FarmRevenuePredictionEntity> findByFarmIdAndCacheRowKey(Long farmId, String cacheRowKey);
}
