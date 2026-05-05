package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminFarmCropPort;
import com.farmbalance.admin.domain.AdminFarmCrop;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 농장-작물 연결 조회 Persistence Adapter (JdbcTemplate)
 * farm_crops 테이블 직접 조회 (seed_registrations에서 rename됨)
 */
@Component
@RequiredArgsConstructor
public class AdminFarmCropPersistenceAdapter implements AdminFarmCropPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminFarmCrop> rowMapper = (rs, rowNum) -> AdminFarmCrop.builder()
            .id(rs.getLong("id"))
            .farmId(rs.getLong("farm_id"))
            .cropId(rs.getLong("crop_id"))
            .estimatedYield(rs.getBigDecimal("estimated_yield"))
            .yieldUnit(rs.getString("yield_unit"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminFarmCrop> findByFarmId(Long farmId) {
        String sql = """
            SELECT fc.id, fc.farm_id, fc.crop_id,
                   fc.estimated_yield, fc.yield_unit,
                   fc.created_at, fc.updated_at, fc.deleted_at
            FROM farm_crops fc
            WHERE fc.farm_id = ? AND fc.deleted_at IS NULL
            """;
        return jdbcTemplate.query(sql, rowMapper, farmId);
    }

    @Override
    public List<AdminFarmCrop> findAll() {
        String sql = """
            SELECT fc.id, fc.farm_id, fc.crop_id,
                   fc.estimated_yield, fc.yield_unit,
                   fc.created_at, fc.updated_at, fc.deleted_at
            FROM farm_crops fc
            WHERE fc.deleted_at IS NULL
            ORDER BY fc.created_at DESC
            """;
        return jdbcTemplate.query(sql, rowMapper);
    }
}
