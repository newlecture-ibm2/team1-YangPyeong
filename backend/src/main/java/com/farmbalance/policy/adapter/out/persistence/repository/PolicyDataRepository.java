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
          AND (p.title IS NULL
               OR (LOWER(p.title) NOT LIKE '%주민의견%'
                   AND LOWER(p.title) NOT LIKE '%의견청취%'
                   AND LOWER(p.title) NOT LIKE '%의견 청취%'
                   AND LOWER(p.title) NOT LIKE '%의견수렴%'
                   AND LOWER(p.title) NOT LIKE '%공람%'
                   AND LOWER(p.title) NOT LIKE '%행정예고%'
                   AND LOWER(p.title) NOT LIKE '%열람공고%'
                   AND LOWER(p.title) NOT LIKE '%사용허가%'
                   AND LOWER(p.title) NOT LIKE '%점용허가%'
                   AND LOWER(p.title) NOT LIKE '%구인공고%'
                   AND LOWER(p.title) NOT LIKE '%구인 공고%'
                   AND LOWER(p.title) NOT LIKE '%채용공고%'
                   AND LOWER(p.title) NOT LIKE '%채용 공고%'
                   AND LOWER(p.title) NOT LIKE '%채용시험%'
                   AND LOWER(p.title) NOT LIKE '%기간제근로자%'
                   AND LOWER(p.title) NOT LIKE '%서류전형%'
                   AND LOWER(p.title) NOT LIKE '%면접시험%'
                   AND LOWER(p.title) NOT LIKE '%합격자%'
                   AND LOWER(p.title) NOT LIKE '%민간위탁%'
                   AND LOWER(p.title) NOT LIKE '%수탁업체%'
                   AND LOWER(p.title) NOT LIKE '%위탁 운영%'
                   AND LOWER(p.title) NOT LIKE '%번지%'))
        ORDER BY
          CASE WHEN p.applyEnd IS NULL OR p.applyEnd >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
          CASE WHEN p.applyEnd IS NULL OR p.applyEnd >= CURRENT_DATE THEN p.applyEnd END ASC NULLS LAST,
          CASE WHEN p.applyEnd IS NOT NULL AND p.applyEnd < CURRENT_DATE THEN p.applyEnd END DESC,
          p.createdAt DESC
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

    /**
     * 맞춤 정책 추천용 활성 정책 전체 조회.
     * 삭제되지 않았으며, 마감일이 지나지 않은(또는 없는) 정책만 가져옵니다.
     */
    @Query("""
        SELECT p FROM PolicyDataJpaEntity p
        WHERE p.deletedAt IS NULL
          AND (p.applyEnd IS NULL OR p.applyEnd >= CURRENT_DATE)
    """)
    java.util.List<PolicyDataJpaEntity> findActivePolicies();
}
