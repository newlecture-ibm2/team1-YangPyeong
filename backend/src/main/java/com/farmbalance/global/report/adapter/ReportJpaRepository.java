package com.farmbalance.global.report.adapter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportJpaRepository extends JpaRepository<ReportJpaEntity, Long> {
    boolean existsByTargetTypeAndTargetIdAndReporterId(String targetType, Long targetId, Long reporterId);
}
