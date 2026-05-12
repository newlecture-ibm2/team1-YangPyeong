package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminReportPort;
import com.farmbalance.admin.domain.AdminReport;
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

    @Override
    public List<AdminReport> findByFilter(String status, int offset, int limit) {
        StringBuilder sql = new StringBuilder("SELECT * FROM reports WHERE 1=1 ");
        if (!"ALL".equalsIgnoreCase(status)) {
            sql.append("AND status = '").append(status.toUpperCase()).append("' ");
        }
        sql.append("ORDER BY created_at DESC LIMIT ? OFFSET ?");
        return jdbcTemplate.query(sql.toString(), rowMapper, limit, offset);
    }

    @Override
    public long countByFilter(String status) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM reports WHERE 1=1 ");
        if (!"ALL".equalsIgnoreCase(status)) {
            sql.append("AND status = '").append(status.toUpperCase()).append("' ");
        }
        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public void updateStatus(Long id, String status) {
        String sql = "UPDATE reports SET status = ? WHERE id = ?";
        jdbcTemplate.update(sql, status, id);
    }
}
