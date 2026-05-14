package com.farmbalance.shop.adapter.out.persistence.repository;

import com.farmbalance.shop.adapter.out.persistence.entity.ProductJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 상품 JPA Repository.
 */
public interface ProductJpaRepository extends JpaRepository<ProductJpaEntity, Long> {

    /** 삭제되지 않은 상품 조회 */
    Optional<ProductJpaEntity> findByIdAndDeletedAtIsNull(Long id);

    /** 판매자의 상품 목록 (삭제되지 않은 것만) */
    List<ProductJpaEntity> findBySellerIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long sellerId);

    /** 판매자의 상품 목록 중 삭제된(Soft Delete) 것만 */
    List<ProductJpaEntity> findBySellerIdAndDeletedAtIsNotNull(Long sellerId);

    /** 활성 상품 목록 (카테고리 필터 + 키워드 검색) - 품절 상품도 장터에 노출되도록 IN 조건 추가 */
    @Query("""
            SELECT p FROM ProductJpaEntity p
            WHERE p.deletedAt IS NULL AND p.status IN ('ACTIVE', 'SOLDOUT')
            AND (:category IS NULL OR :category = '' OR EXISTS (
                SELECT 1 FROM com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity c
                WHERE c.id = p.categoryId AND c.name = :category
            ))
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<ProductJpaEntity> findActiveProducts(
            @Param("category") String category,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /** 활성 상품 수 (필터 적용) */
    @Query("""
            SELECT COUNT(p) FROM ProductJpaEntity p
            WHERE p.deletedAt IS NULL AND p.status IN ('ACTIVE', 'SOLDOUT')
            AND (:category IS NULL OR :category = '' OR EXISTS (
                SELECT 1 FROM com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity c
                WHERE c.id = p.categoryId AND c.name = :category
            ))
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    long countActiveProducts(@Param("category") String category, @Param("keyword") String keyword);

    /** 전체 상품 목록 (관리자용 — 삭제되지 않은 전체 상품) */
    List<ProductJpaEntity> findByDeletedAtIsNullOrderByCreatedAtDesc();

    /** 관리자용 상품 목록 조회 (다중 상태 필터, 정렬, 페이징 적용) */
    @Query("""
            SELECT p FROM ProductJpaEntity p
            WHERE p.deletedAt IS NULL
            AND (:isAllStatus = true OR p.status IN :statuses)
            AND (:category IS NULL OR :category = 'ALL' OR EXISTS (
                SELECT 1 FROM com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity c
                WHERE c.id = p.categoryId AND c.name = :category
            ))
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<ProductJpaEntity> findAdminProducts(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("statuses") List<String> statuses,
            @Param("isAllStatus") boolean isAllStatus,
            Pageable pageable
    );

    /** 관리자용 상품 총 개수 (다중 상태 필터 적용) */
    @Query("""
            SELECT COUNT(p) FROM ProductJpaEntity p
            WHERE p.deletedAt IS NULL
            AND (:isAllStatus = true OR p.status IN :statuses)
            AND (:category IS NULL OR :category = 'ALL' OR EXISTS (
                SELECT 1 FROM com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity c
                WHERE c.id = p.categoryId AND c.name = :category
            ))
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    long countAdminProducts(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("statuses") List<String> statuses,
            @Param("isAllStatus") boolean isAllStatus
    );
}
