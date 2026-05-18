package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminReport;

import java.util.List;

public interface AdminReportPort {
    List<AdminReport> findByFilter(String status, int offset, int limit);
    long countByFilter(String status);
    void updateStatus(Long id, String status);
    java.util.Optional<AdminReport> findById(Long id);
}
