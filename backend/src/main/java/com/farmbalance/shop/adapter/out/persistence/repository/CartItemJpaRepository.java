package com.farmbalance.shop.adapter.out.persistence.repository;

import com.farmbalance.shop.adapter.out.persistence.entity.CartItemJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 장바구니 JPA Repository.
 */
public interface CartItemJpaRepository extends JpaRepository<CartItemJpaEntity, Long> {

    List<CartItemJpaEntity> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    Optional<CartItemJpaEntity> findByIdAndDeletedAtIsNull(Long id);

    Optional<CartItemJpaEntity> findByUserIdAndProductIdAndDeletedAtIsNull(Long userId, Long productId);

    void deleteByUserId(Long userId);
}
