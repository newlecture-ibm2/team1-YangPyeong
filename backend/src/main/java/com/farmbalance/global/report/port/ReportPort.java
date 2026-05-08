package com.farmbalance.global.report.port;

import com.farmbalance.global.report.domain.Report;

public interface ReportPort {
    Report save(Report report);
    boolean existsByTargetAndReporter(String targetType, Long targetId, Long reporterId);
}
