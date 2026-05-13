package com.farmbalance.global.report.port;

import com.farmbalance.global.report.domain.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportPort {
    Report save(Report report);
    boolean existsByTargetAndReporter(String targetType, Long targetId, Long reporterId);
    Page<Report> findByReporterId(Long reporterId, Pageable pageable);
}
