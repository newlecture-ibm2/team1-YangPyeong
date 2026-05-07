package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminUserPort;
import com.farmbalance.admin.domain.AdminUser;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
    public List<AdminUser> findByFilter(String keyword, String role, String status, int offset, int limit) {
        StringBuilder sql = new StringBuilder("SELECT * FROM users WHERE deleted_at IS NULL");
        List<Object> params = new ArrayList<>();

        appendFilterConditions(sql, params, keyword, role, status);

        sql.append(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }

    @Override
    public long countByFilter(String keyword, String role, String status) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL");
        List<Object> params = new ArrayList<>();

        appendFilterConditions(sql, params, keyword, role, status);

        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0;
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

    /**
     * 검색/필터 WHERE 절 조건을 동적으로 추가하는 헬퍼
     */
    private void appendFilterConditions(StringBuilder sql, List<Object> params,
                                        String keyword, String role, String status) {
        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (name LIKE ? OR email LIKE ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
        }
        if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
            sql.append(" AND role = ?");
            params.add(role.toUpperCase());
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND status = ?");
            params.add(status.toUpperCase());
        }
    }
}
