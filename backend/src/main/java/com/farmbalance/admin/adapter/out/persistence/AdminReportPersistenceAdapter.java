package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminReportPort;
import com.farmbalance.admin.domain.AdminReport;
import com.farmbalance.admin.domain.AdminGroupedReport;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminReportPersistenceAdapter implements AdminReportPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminReport> rowMapper = (rs, rowNum) -> AdminReport.builder()
            .id(rs.getLong("id"))
            .targetType(rs.getString("target_type"))
            .targetId(rs.getLong("target_id"))
            .reporterId(rs.getLong("reporter_id"))
            .reason(rs.getString("reason"))
            .status(rs.getString("status"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .build();

    private final RowMapper<AdminGroupedReport> groupedRowMapper = (rs, rowNum) -> AdminGroupedReport.builder()
            .targetType(rs.getString("target_type"))
            .targetId(rs.getLong("target_id"))
            .reportCount(rs.getLong("report_count"))
            .recentReason(rs.getString("recent_reason"))
            .status(rs.getString("status"))
            .recentReportAt(rs.getTimestamp("recent_report_at") != null ? rs.getTimestamp("recent_report_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminGroupedReport> findGroupedByFilter(String status, int offset, int limit) {
        StringBuilder sql = new StringBuilder(
                "SELECT target_type, target_id, COUNT(*) as report_count, " +
                "MAX(reason) as recent_reason, MAX(created_at) as recent_report_at, status " +
                "FROM reports WHERE 1=1 ");
        
        if (!"ALL".equalsIgnoreCase(status)) {
            sql.append("AND status = '").append(status.toUpperCase()).append("' ");
        }
        
        sql.append("GROUP BY target_type, target_id, status ");
        
        if ("PENDING".equalsIgnoreCase(status)) {
            sql.append("HAVING COUNT(*) >= CASE " +
                       "WHEN EXISTS (SELECT 1 FROM reports r2 WHERE r2.target_type = reports.target_type AND r2.target_id = reports.target_id AND r2.status = 'DISMISSED') " +
                       "THEN 3 ELSE 1 END ");
        }
        
        sql.append("ORDER BY recent_report_at DESC LIMIT ? OFFSET ?");
        return jdbcTemplate.query(sql.toString(), groupedRowMapper, limit, offset);
    }

    @Override
    public long countGroupedByFilter(String status) {
        StringBuilder sql = new StringBuilder(
                "SELECT COUNT(*) FROM (SELECT target_type, target_id FROM reports WHERE 1=1 ");
        
        if (!"ALL".equalsIgnoreCase(status)) {
            sql.append("AND status = '").append(status.toUpperCase()).append("' ");
        }
        
        sql.append("GROUP BY target_type, target_id, status ");
        
        if ("PENDING".equalsIgnoreCase(status)) {
            sql.append("HAVING COUNT(*) >= CASE " +
                       "WHEN EXISTS (SELECT 1 FROM reports r2 WHERE r2.target_type = reports.target_type AND r2.target_id = reports.target_id AND r2.status = 'DISMISSED') " +
                       "THEN 3 ELSE 1 END ");
        }
        
        sql.append(") AS grouped_reports");
        
        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public void updateStatusByTarget(String targetType, Long targetId, String status) {
        String sql = "UPDATE reports SET status = ? WHERE target_type = ? AND target_id = ? AND status = 'PENDING'";
        jdbcTemplate.update(sql, status, targetType, targetId);
    }

    @Override
    public java.util.Optional<AdminReport> findById(Long id) {
        String sql = "SELECT * FROM reports WHERE id = ?";
        List<AdminReport> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(results.get(0));
    }
}
