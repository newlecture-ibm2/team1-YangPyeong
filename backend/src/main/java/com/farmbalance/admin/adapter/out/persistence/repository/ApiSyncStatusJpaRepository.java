package com.farmbalance.admin.adapter.out.persistence.repository;

import com.farmbalance.admin.adapter.out.persistence.entity.ApiSyncStatusJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * API 동기화 상태 JPA Repository
 */
public interface ApiSyncStatusJpaRepository extends JpaRepository<ApiSyncStatusJpaEntity, Long> {

    Optional<ApiSyncStatusJpaEntity> findByApiName(String apiName);

    List<ApiSyncStatusJpaEntity> findByIsActive(boolean isActive);
}
