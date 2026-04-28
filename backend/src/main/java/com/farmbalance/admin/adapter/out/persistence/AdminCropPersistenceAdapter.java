package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminCropPort;
import com.farmbalance.admin.domain.AdminCrop;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-003 작물 마스터 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminCropPersistenceAdapter implements AdminCropPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminCrop> rowMapper = (rs, rowNum) -> AdminCrop.builder()
            .id(rs.getLong("id"))
            .categoryId(rs.getLong("category_id"))
            .code(rs.getString("code"))
            .name(rs.getString("name"))
            .growthDays(rs.getInt("growth_days"))
            .yieldPerSqm(rs.getBigDecimal("yield_per_sqm"))
            .avgCostPerSqm(rs.getBigDecimal("avg_cost_per_sqm"))
            .climateConditions(rs.getString("climate_conditions"))
            .isActive(rs.getBoolean("is_active"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminCrop> findAll() {
        String sql = "SELECT * FROM crops WHERE deleted_at IS NULL ORDER BY code";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<AdminCrop> findById(Long id) {
        String sql = "SELECT * FROM crops WHERE id = ? AND deleted_at IS NULL";
        List<AdminCrop> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public Long save(AdminCrop crop) {
        String sql = "INSERT INTO crops (category_id, code, name, growth_days, yield_per_sqm, avg_cost_per_sqm, climate_conditions, is_active, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, NOW()) RETURNING id";
        return jdbcTemplate.queryForObject(sql, Long.class,
                crop.getCategoryId(), crop.getCode(), crop.getName(), crop.getGrowthDays(),
                crop.getYieldPerSqm(), crop.getAvgCostPerSqm(), crop.getClimateConditions(),
                crop.getIsActive());
    }

    @Override
    public void update(AdminCrop crop) {
        String sql = "UPDATE crops SET category_id = ?, code = ?, name = ?, growth_days = ?, " +
                "yield_per_sqm = ?, avg_cost_per_sqm = ?, climate_conditions = ?::jsonb, is_active = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql,
                crop.getCategoryId(), crop.getCode(), crop.getName(), crop.getGrowthDays(),
                crop.getYieldPerSqm(), crop.getAvgCostPerSqm(), crop.getClimateConditions(),
                crop.getIsActive(), crop.getId());
    }

    @Override
    public void deactivate(Long id) {
        String sql = "UPDATE crops SET is_active = false, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
