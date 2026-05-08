package com.farmbalance.recommend.adapter.out.persistence;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendHistoryRepository extends JpaRepository<RecommendHistoryEntity, Long> {

    @EntityGraph(attributePaths = {"items"})
    List<RecommendHistoryEntity> findByFarmIdOrderByGeneratedAtDesc(Long farmId);

    @EntityGraph(attributePaths = {"items"})
    Optional<RecommendHistoryEntity> findFirstByFarmIdOrderByGeneratedAtDesc(Long farmId);
}
