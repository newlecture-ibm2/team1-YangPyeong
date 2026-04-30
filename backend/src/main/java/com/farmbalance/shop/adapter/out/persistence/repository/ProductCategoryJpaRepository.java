package com.farmbalance.shop.adapter.out.persistence.repository;

import com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 상품 카테고리 JPA Repository.
 */
public interface ProductCategoryJpaRepository extends JpaRepository<ProductCategoryJpaEntity, Long> {

    Optional<ProductCategoryJpaEntity> findByName(String name);

    /** 활성 카테고리 목록 (정렬순) */
    java.util.List<ProductCategoryJpaEntity> findByActiveTrueOrderByDisplayOrderAsc();
}
