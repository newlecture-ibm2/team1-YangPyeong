package com.farmbalance.shop.adapter.out.persistence.repository;

import com.farmbalance.shop.adapter.out.persistence.entity.OrderJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 주문 JPA Repository.
 */
public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, Long> {

    Optional<OrderJpaEntity> findByIdAndDeletedAtIsNull(Long id);

    List<OrderJpaEntity> findByBuyerIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long buyerId);

    /** 판매자가 받은 주문: order_items에 해당 판매자의 상품이 포함된 주문 */
    @Query("""
            SELECT DISTINCT o FROM OrderJpaEntity o
            JOIN o.items oi
            JOIN ProductJpaEntity p ON p.id = oi.productId
            WHERE p.sellerId = :sellerId AND o.deletedAt IS NULL
            ORDER BY o.createdAt DESC
            """)
    List<OrderJpaEntity> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") Long sellerId);

    /** 접수(ACCEPTED) 후 일정 시간이 지난 주문 조회 (자동 배송완료 처리용) */
    @Query("""
            SELECT o FROM OrderJpaEntity o
            WHERE o.status = :status AND o.updatedAt < :before AND o.deletedAt IS NULL
            """)
    List<OrderJpaEntity> findByStatusAndUpdatedAtBefore(
            @Param("status") String status,
            @Param("before") java.time.LocalDateTime before);
}
