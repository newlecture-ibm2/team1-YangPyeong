package com.farmbalance.policy.adapter.out.persistence.repository;

import com.farmbalance.policy.adapter.out.persistence.entity.PolicyDataJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * 정책 데이터 JPA Repository.
 */
@Repository
public interface PolicyDataRepository extends JpaRepository<PolicyDataJpaEntity, Long> {

    /**
     * external_id + source 기준 조회 (upsert 판별용)
     */
    Optional<PolicyDataJpaEntity> findByExternalIdAndSource(String externalId, String source);

    /**
     * 동적 검색 쿼리.
     * 삭제되지 않은 정책만 조회하며, 각 필터는 null이면 무시합니다.
     */
    @Query("""
        SELECT p FROM PolicyDataJpaEntity p
        WHERE p.deletedAt IS NULL
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.organization) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:regionCode IS NULL OR :regionCode = '' OR p.regionCode = :regionCode)
          AND (:category IS NULL OR :category = '' OR p.category = :category)
          AND (:period IS NULL OR :period = ''
               OR (:period = 'active' AND (p.applyEnd IS NULL OR p.applyEnd >= CURRENT_DATE))
               OR (:period = 'closed' AND p.applyEnd IS NOT NULL AND p.applyEnd < CURRENT_DATE))
          AND (:minConfidence IS NULL OR p.confidence >= :minConfidence)
        ORDER BY p.applyEnd ASC NULLS LAST, p.createdAt DESC
    """)
    Page<PolicyDataJpaEntity> searchPolicies(
            @Param("keyword") String keyword,
            @Param("regionCode") String regionCode,
            @Param("category") String category,
            @Param("period") String period,
            @Param("minConfidence") BigDecimal minConfidence,
            Pageable pageable
    );

    /**
     * source 기준 일괄 삭제 (Mock 데이터 정리용).
     */
    void deleteBySource(String source);
}
