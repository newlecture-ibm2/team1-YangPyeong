package com.farmbalance.notification.adapter.out.persistence.repository;

import com.farmbalance.notification.adapter.out.persistence.entity.NotificationJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 알림 JPA Repository
 */
public interface NotificationJpaRepository extends JpaRepository<NotificationJpaEntity, Long> {

    /** 활성(삭제되지 않은) 알림 단건 조회 */
    @Query("SELECT n FROM NotificationJpaEntity n WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<NotificationJpaEntity> findActiveById(@Param("id") Long id);

    /** 사용자별 알림 목록 — 타입/읽음 필터 + 페이징 */
    @Query("""
        SELECT n FROM NotificationJpaEntity n
        WHERE n.userId = :userId
          AND n.deletedAt IS NULL
          AND (:type IS NULL OR n.type = :type)
          AND (:isRead IS NULL OR n.isRead = :isRead)
        ORDER BY n.createdAt DESC
    """)
    Page<NotificationJpaEntity> findByUserIdAndFilters(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("isRead") Boolean isRead,
            Pageable pageable
    );

    /** 읽지 않은 알림 수 */
    @Query("SELECT COUNT(n) FROM NotificationJpaEntity n WHERE n.userId = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    long countUnreadByUserId(@Param("userId") Long userId);

    /** 전체 읽음 처리 (벌크 업데이트) */
    @Modifying
    @Query("UPDATE NotificationJpaEntity n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    void markAllAsReadByUserId(@Param("userId") Long userId);
}
