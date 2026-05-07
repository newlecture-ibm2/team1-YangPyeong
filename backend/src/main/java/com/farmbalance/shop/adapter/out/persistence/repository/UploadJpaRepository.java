package com.farmbalance.shop.adapter.out.persistence.repository;

import com.farmbalance.shop.adapter.out.persistence.entity.UploadJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 공통 업로드 파일 JPA Repository.
 */
public interface UploadJpaRepository extends JpaRepository<UploadJpaEntity, Long> {

    /** 엔티티별 파일 조회 (삭제되지 않은 것만, 순서대로) */
    List<UploadJpaEntity> findByEntityTypeAndEntityIdAndDeletedAtIsNullOrderByDisplayOrderAsc(
            String entityType, Long entityId);

    /** 엔티티별 파일 soft delete */
    @Modifying
    @Query("UPDATE UploadJpaEntity u SET u.deletedAt = CURRENT_TIMESTAMP WHERE u.entityType = :type AND u.entityId = :entityId AND u.deletedAt IS NULL")
    void softDeleteByEntity(@Param("type") String entityType, @Param("entityId") Long entityId);
}
