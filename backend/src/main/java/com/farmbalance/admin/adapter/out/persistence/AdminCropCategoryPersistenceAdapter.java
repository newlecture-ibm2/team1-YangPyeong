package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminCropCategoryPort;
import com.farmbalance.admin.domain.AdminCropCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * ADM-003 작물 카테고리 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminCropCategoryPersistenceAdapter implements AdminCropCategoryPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminCropCategory> rowMapper = (rs, rowNum) -> AdminCropCategory.builder()
            .id(rs.getLong("id"))
            .name(rs.getString("name"))
            .description(rs.getString("description"))
            .displayOrder(rs.getInt("display_order"))
            .isActive(rs.getBoolean("is_active"))
            .externalId(rs.getString("external_id"))
            .dataSource(rs.getString("data_source"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminCropCategory> findAll() {
        String sql = "SELECT * FROM crop_categories WHERE deleted_at IS NULL ORDER BY display_order";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<AdminCropCategory> findById(Long id) {
        String sql = "SELECT * FROM crop_categories WHERE id = ? AND deleted_at IS NULL";
        List<AdminCropCategory> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public boolean existsByName(String name) {
        String sql = "SELECT COUNT(*) FROM crop_categories WHERE name = ? AND deleted_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, name);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByNameExcludeId(String name, Long excludeId) {
        String sql = "SELECT COUNT(*) FROM crop_categories WHERE name = ? AND id != ? AND deleted_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, name, excludeId);
        return count != null && count > 0;
    }

    @Override
    public Optional<AdminCropCategory> findByName(String name) {
        String sql = "SELECT * FROM crop_categories WHERE name = ? AND deleted_at IS NULL";
        List<AdminCropCategory> result = jdbcTemplate.query(sql, rowMapper, name);
        return result.stream().findFirst();
    }

    @Override
    public Optional<AdminCropCategory> findByExternalId(String externalId) {
        if (externalId == null || externalId.trim().isEmpty()) return Optional.empty();
        String sql = "SELECT * FROM crop_categories WHERE external_id = ? AND deleted_at IS NULL";
        List<AdminCropCategory> result = jdbcTemplate.query(sql, rowMapper, externalId);
        return result.stream().findFirst();
    }

    @Override
    public Long save(AdminCropCategory category) {
        String sql = "INSERT INTO crop_categories (name, description, display_order, is_active, external_id, data_source, created_at) " +
                "VALUES (?, ?, ?, true, ?, ?, NOW()) RETURNING id";
        return jdbcTemplate.queryForObject(sql, Long.class,
                category.getName(), category.getDescription(),
                category.getDisplayOrder() != null ? category.getDisplayOrder() : 0,
                category.getExternalId(),
                category.getDataSource() != null ? category.getDataSource() : "MANUAL");
    }

    @Override
    public void update(AdminCropCategory category) {
        StringBuilder sql = new StringBuilder("UPDATE crop_categories SET updated_at = NOW()");
        List<Object> params = new ArrayList<>();

        if (category.getName() != null) { sql.append(", name = ?"); params.add(category.getName()); }
        if (category.getDescription() != null) { sql.append(", description = ?"); params.add(category.getDescription()); }
        if (category.getDisplayOrder() != null) { sql.append(", display_order = ?"); params.add(category.getDisplayOrder()); }
        if (category.getIsActive() != null) { sql.append(", is_active = ?"); params.add(category.getIsActive()); }
        if (category.getExternalId() != null) { sql.append(", external_id = ?"); params.add(category.getExternalId()); }
        if (category.getDataSource() != null) { sql.append(", data_source = ?"); params.add(category.getDataSource()); }

        sql.append(" WHERE id = ?");
        params.add(category.getId());

        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    @Override
    public void delete(Long id) {
        String sql = "UPDATE crop_categories SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}

