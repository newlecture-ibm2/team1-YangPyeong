package com.farmbalance.community.adapter.out.persistence.repository;

import com.farmbalance.community.adapter.out.persistence.entity.PostEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostJpaRepository extends JpaRepository<PostEntity, Long> {

    @Query("SELECT p FROM PostEntity p JOIN FETCH p.category WHERE p.id = :id AND p.deletedAt IS NULL AND p.isHidden = false")
    Optional<PostEntity> findActiveById(@Param("id") Long id);

    @Query("SELECT p.id, p.title FROM PostEntity p WHERE p.id IN :ids AND p.deletedAt IS NULL")
    List<Object[]> findActiveTitlesByIds(@Param("ids") List<Long> ids);

    @Query("SELECT p FROM PostEntity p JOIN FETCH p.category " +
           "WHERE p.deletedAt IS NULL AND p.isHidden = false " +
           "AND (:categoryIds IS NULL OR p.category.id IN :categoryIds) " +
           "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<PostEntity> findByFilters(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT p FROM PostEntity p JOIN FETCH p.category " +
           "WHERE p.deletedAt IS NULL AND p.isHidden = false " +
           "AND (:categoryIds IS NULL OR p.category.id IN :categoryIds) " +
           "AND (:keyword IS NULL OR p.title LIKE %:keyword%)")
    Page<PostEntity> findByFiltersTitle(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT p FROM PostEntity p JOIN FETCH p.category " +
           "WHERE p.deletedAt IS NULL AND p.isHidden = false " +
           "AND (:categoryIds IS NULL OR p.category.id IN :categoryIds) " +
           "AND (:keyword IS NULL OR p.content LIKE %:keyword%)")
    Page<PostEntity> findByFiltersContent(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("keyword") String keyword,
            Pageable pageable);

    List<PostEntity> findTop5ByDeletedAtIsNullAndIsHiddenFalseOrderByCreatedAtDesc();

    @Query("SELECT p FROM PostEntity p JOIN FETCH p.category " +
           "WHERE p.authorId = :authorId AND p.deletedAt IS NULL " +
           "AND (:status = 'ALL' OR (:status = 'ACTIVE' AND p.isHidden = false) OR (:status = 'HIDDEN' AND p.isHidden = true))")
    Page<PostEntity> findByAuthorIdAndStatus(@Param("authorId") Long authorId, @Param("status") String status, Pageable pageable);
}
