package com.farmbalance.recommend.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FarmCropDetailedGuideRepository extends JpaRepository<FarmCropDetailedGuideEntity, Long> {

    Optional<FarmCropDetailedGuideEntity> findByFarmIdAndCacheKey(Long farmId, String cacheKey);
}
