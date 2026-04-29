package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminCropPort;
import com.farmbalance.admin.domain.AdminCrop;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
            .growthDays(rs.getObject("growth_days") != null ? rs.getInt("growth_days") : null)
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
    public List<AdminCrop> findByFilter(Long categoryId, String keyword, Boolean isActive) {
        StringBuilder sql = new StringBuilder("SELECT * FROM crops WHERE deleted_at IS NULL");
        List<Object> params = new ArrayList<>();

        if (categoryId != null) {
            sql.append(" AND category_id = ?");
            params.add(categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (name LIKE ? OR code LIKE ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
        }
        if (isActive != null) {
            sql.append(" AND is_active = ?");
            params.add(isActive);
        }

        sql.append(" ORDER BY code");
        return jdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }

    @Override
    public Optional<AdminCrop> findById(Long id) {
        String sql = "SELECT * FROM crops WHERE id = ? AND deleted_at IS NULL";
        List<AdminCrop> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public boolean existsByName(String name) {
        String sql = "SELECT COUNT(*) FROM crops WHERE name = ? AND deleted_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, name);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByNameExcludeId(String name, Long excludeId) {
        String sql = "SELECT COUNT(*) FROM crops WHERE name = ? AND id != ? AND deleted_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, name, excludeId);
        return count != null && count > 0;
    }

    @Override
    public Long save(AdminCrop crop) {
        String code = generateCropCode();
        String sql = "INSERT INTO crops (category_id, code, name, growth_days, yield_per_sqm, avg_cost_per_sqm, climate_conditions, is_active, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, true, NOW()) RETURNING id";
        return jdbcTemplate.queryForObject(sql, Long.class,
                crop.getCategoryId(), code, crop.getName(), crop.getGrowthDays(),
                crop.getYieldPerSqm(), crop.getAvgCostPerSqm(), crop.getClimateConditions());
    }

    @Override
    public void update(AdminCrop crop) {
        StringBuilder sql = new StringBuilder("UPDATE crops SET updated_at = NOW()");
        List<Object> params = new ArrayList<>();

        if (crop.getCategoryId() != null) { sql.append(", category_id = ?"); params.add(crop.getCategoryId()); }
        if (crop.getName() != null) { sql.append(", name = ?"); params.add(crop.getName()); }
        if (crop.getGrowthDays() != null) { sql.append(", growth_days = ?"); params.add(crop.getGrowthDays()); }
        if (crop.getYieldPerSqm() != null) { sql.append(", yield_per_sqm = ?"); params.add(crop.getYieldPerSqm()); }
        if (crop.getAvgCostPerSqm() != null) { sql.append(", avg_cost_per_sqm = ?"); params.add(crop.getAvgCostPerSqm()); }
        if (crop.getClimateConditions() != null) { sql.append(", climate_conditions = ?::jsonb"); params.add(crop.getClimateConditions()); }
        if (crop.getIsActive() != null) { sql.append(", is_active = ?"); params.add(crop.getIsActive()); }

        sql.append(" WHERE id = ?");
        params.add(crop.getId());

        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    @Override
    public void deactivate(Long id) {
        String sql = "UPDATE crops SET is_active = false, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    /** 작물 코드 자동 생성: CRP + 6자리 (예: CRP000001) */
    private String generateCropCode() {
        String sql = "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) + 1 FROM crops WHERE code LIKE 'CRP%'";
        Integer seq = jdbcTemplate.queryForObject(sql, Integer.class);
        return String.format("CRP%06d", seq != null ? seq : 1);
    }
}

