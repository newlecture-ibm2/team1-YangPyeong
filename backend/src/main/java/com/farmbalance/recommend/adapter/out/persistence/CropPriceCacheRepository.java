package com.farmbalance.recommend.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface CropPriceCacheRepository extends JpaRepository<CropPriceCacheEntity, Long> {
    
    Optional<CropPriceCacheEntity> findTopByCropNameAndPriceDateOrderByIdDesc(String cropName, LocalDate priceDate);
    
    Optional<CropPriceCacheEntity> findTopByCropNameOrderByPriceDateDesc(String cropName);
}
