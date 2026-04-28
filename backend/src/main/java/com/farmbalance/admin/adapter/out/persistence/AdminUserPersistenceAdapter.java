package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminUserPort;
import com.farmbalance.admin.domain.AdminUser;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-001 사용자 관리 Persistence Adapter (JdbcTemplate — 다른 도메인 테이블 접근)
 */
@Component
@RequiredArgsConstructor
public class AdminUserPersistenceAdapter implements AdminUserPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminUser> rowMapper = (rs, rowNum) -> AdminUser.builder()
            .id(rs.getLong("id"))
            .email(rs.getString("email"))
            .name(rs.getString("name"))
            .phone(rs.getString("phone"))
            .role(rs.getString("role"))
            .region(rs.getString("region"))
            .status(rs.getString("status"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminUser> findAll() {
        String sql = "SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<AdminUser> findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL";
        List<AdminUser> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public void updateRole(Long id, String role) {
        String sql = "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, role, id);
    }

    @Override
    public void updateStatus(Long id, String status) {
        String sql = "UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, status, id);
    }
}
