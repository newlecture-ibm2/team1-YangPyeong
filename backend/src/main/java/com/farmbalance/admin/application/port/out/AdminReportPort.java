package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminGroupedReport;

import java.util.List;

public interface AdminReportPort {
    List<AdminGroupedReport> findGroupedByFilter(String status, int offset, int limit);
    long countGroupedByFilter(String status);
    void updateStatusByTarget(String targetType, Long targetId, String status);
    void updateStatusAndActionByTarget(String targetType, Long targetId, String status, String actionTaken);
    java.util.Optional<com.farmbalance.admin.domain.AdminReport> findById(Long id);
}
