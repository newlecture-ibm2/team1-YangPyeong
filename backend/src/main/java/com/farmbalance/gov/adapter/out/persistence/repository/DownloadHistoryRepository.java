package com.farmbalance.gov.adapter.out.persistence.repository;

import com.farmbalance.gov.adapter.out.persistence.entity.DownloadHistoryJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 다운로드 이력 JPA Repository
 */
public interface DownloadHistoryRepository extends JpaRepository<DownloadHistoryJpaEntity, Long> {

    /** 사용자별 최신순 N건 조회 */
    List<DownloadHistoryJpaEntity> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
