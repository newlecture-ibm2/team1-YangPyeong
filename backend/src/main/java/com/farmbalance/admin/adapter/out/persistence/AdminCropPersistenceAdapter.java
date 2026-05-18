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
 * 작물 마스터 관리 Persistence Adapter (JdbcTemplate)
 * CRUD 지원 (단순화: categoryId + name)
 */
@Component
@RequiredArgsConstructor
public class AdminCropPersistenceAdapter implements AdminCropPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminCrop> rowMapper = (rs, rowNum) -> AdminCrop.builder()
            .id(rs.getLong("id"))
            .categoryId(rs.getLong("category_id"))
            .name(rs.getString("name"))
            .externalId(rs.getString("external_id"))
            .dataSource(rs.getString("data_source"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminCrop> findAll() {
        String sql = "SELECT * FROM crops WHERE deleted_at IS NULL ORDER BY name";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public List<AdminCrop> findByFilter(Long categoryId, String keyword) {
        StringBuilder sql = new StringBuilder("SELECT * FROM crops WHERE deleted_at IS NULL");
        List<Object> params = new ArrayList<>();

        if (categoryId != null) {
            sql.append(" AND category_id = ?");
            params.add(categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND name LIKE ?");
            params.add("%" + keyword.trim() + "%");
        }

        sql.append(" ORDER BY name");
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
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, name);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByNameExcludeId(String name, Long excludeId) {
        String sql = "SELECT COUNT(*) FROM crops WHERE name = ? AND id != ? AND deleted_at IS NULL";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, name, excludeId);
        return count != null && count > 0;
    }

    @Override
    public Optional<AdminCrop> findByName(String name) {
        String sql = "SELECT * FROM crops WHERE name = ? AND deleted_at IS NULL";
        List<AdminCrop> result = jdbcTemplate.query(sql, rowMapper, name);
        return result.stream().findFirst();
    }

    @Override
    public Optional<AdminCrop> findByExternalId(String externalId) {
        if (externalId == null || externalId.trim().isEmpty()) return Optional.empty();
        String sql = "SELECT * FROM crops WHERE external_id = ? AND deleted_at IS NULL";
        List<AdminCrop> result = jdbcTemplate.query(sql, rowMapper, externalId);
        return result.stream().findFirst();
    }

    @Override
    public Long save(AdminCrop crop) {
        String code = generateCropCode();
        String sql = "INSERT INTO crops (category_id, code, name, external_id, data_source, created_at) VALUES (?, ?, ?, ?, ?, NOW()) RETURNING id";
        return jdbcTemplate.queryForObject(sql, Long.class, 
                crop.getCategoryId(), 
                code,
                crop.getName(),
                crop.getExternalId(),
                crop.getDataSource() != null ? crop.getDataSource() : "MANUAL");
    }

    @Override
    public void update(AdminCrop crop) {
        StringBuilder sql = new StringBuilder("UPDATE crops SET updated_at = NOW()");
        List<Object> params = new ArrayList<>();

        if (crop.getCategoryId() != null) { sql.append(", category_id = ?"); params.add(crop.getCategoryId()); }
        if (crop.getName() != null) { sql.append(", name = ?"); params.add(crop.getName()); }
        if (crop.getExternalId() != null) { sql.append(", external_id = ?"); params.add(crop.getExternalId()); }
        if (crop.getDataSource() != null) { sql.append(", data_source = ?"); params.add(crop.getDataSource()); }

        sql.append(" WHERE id = ? AND deleted_at IS NULL");
        params.add(crop.getId());

        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    @Override
    public void delete(Long id) {
        String sql = "UPDATE crops SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL";
        jdbcTemplate.update(sql, id);
    }

    /** 작물 코드 자동 생성: CRP + 6자리 (예: CRP000001) */
    private String generateCropCode() {
        String sql = "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) + 1 FROM crops WHERE code LIKE 'CRP%'";
        Integer seq = jdbcTemplate.queryForObject(sql, Integer.class);
        return String.format("CRP%06d", seq != null ? seq : 1);
    }
}
