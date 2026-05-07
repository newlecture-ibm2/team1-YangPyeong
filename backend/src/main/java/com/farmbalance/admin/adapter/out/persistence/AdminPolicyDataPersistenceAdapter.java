package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminPolicyDataPort;
import com.farmbalance.admin.domain.AdminPolicyData;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-012 정책 데이터 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminPolicyDataPersistenceAdapter implements AdminPolicyDataPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminPolicyData> rowMapper = (rs, rowNum) -> AdminPolicyData.builder()
            .id(rs.getLong("id"))
            .externalId(rs.getString("external_id"))
            .data(rs.getString("data"))
            .fetchedAt(rs.getTimestamp("fetched_at") != null ? rs.getTimestamp("fetched_at").toLocalDateTime() : null)
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminPolicyData> findAll() {
        String sql = "SELECT * FROM policy_data WHERE deleted_at IS NULL ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<AdminPolicyData> findById(Long id) {
        String sql = "SELECT * FROM policy_data WHERE id = ? AND deleted_at IS NULL";
        List<AdminPolicyData> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public Long save(AdminPolicyData policyData) {
        String sql = "INSERT INTO policy_data (external_id, data, fetched_at, created_at) VALUES (?, ?::jsonb, ?, NOW()) RETURNING id";
        return jdbcTemplate.queryForObject(sql, Long.class,
                policyData.getExternalId(), policyData.getData(), policyData.getFetchedAt());
    }

    @Override
    public void update(AdminPolicyData policyData) {
        String sql = "UPDATE policy_data SET external_id = ?, data = ?::jsonb, fetched_at = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql,
                policyData.getExternalId(), policyData.getData(), policyData.getFetchedAt(), policyData.getId());
    }
}
