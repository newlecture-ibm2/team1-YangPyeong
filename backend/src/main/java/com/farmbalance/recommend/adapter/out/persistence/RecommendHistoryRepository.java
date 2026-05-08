package com.farmbalance.recommend.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendHistoryRepository extends JpaRepository<RecommendHistoryEntity, Long> {

    List<RecommendHistoryEntity> findTop20ByFarmIdOrderByGeneratedAtDesc(Long farmId);

    Optional<RecommendHistoryEntity> findFirstByFarmIdOrderByGeneratedAtDesc(Long farmId);
}
