package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminSeedRegistrationPort;
import com.farmbalance.admin.domain.AdminSeedRegistration;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ADM-002 종자 등록 조회 Persistence Adapter (JdbcTemplate)
 *
 * [변경 사항] receipt_image_url 컬럼이 공통 uploads 테이블로 이관됨.
 * uploads 테이블에서 entity_type='SEED_RECEIPT', entity_id=sr.id로 조회합니다.
 */
@Component
@RequiredArgsConstructor
public class AdminSeedRegistrationPersistenceAdapter implements AdminSeedRegistrationPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminSeedRegistration> rowMapper = (rs, rowNum) -> AdminSeedRegistration.builder()
            .id(rs.getLong("id"))
            .farmId(rs.getLong("farm_id"))
            .cropId(rs.getLong("crop_id"))
            .seedType(rs.getString("seed_type"))
            .quantity(rs.getInt("quantity"))
            .estimatedYield(rs.getBigDecimal("estimated_yield"))
            .yieldUnit(rs.getString("yield_unit"))
            .receiptImageUrl(rs.getString("receipt_image_url"))
            .verified(rs.getBoolean("verified"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminSeedRegistration> findByFarmId(Long farmId) {
        String sql = """
            SELECT sr.*,
                   COALESCE(img.file_url, sr.receipt_image_url) AS receipt_image_url
            FROM seed_registrations sr
            LEFT JOIN uploads img ON img.entity_type = 'SEED_RECEIPT'
                AND img.entity_id = sr.id AND img.deleted_at IS NULL AND img.display_order = 0
            WHERE sr.farm_id = ? AND sr.deleted_at IS NULL
            """;
        return jdbcTemplate.query(sql, rowMapper, farmId);
    }

    @Override
    public List<AdminSeedRegistration> findAll() {
        String sql = """
            SELECT sr.*,
                   COALESCE(img.file_url, sr.receipt_image_url) AS receipt_image_url
            FROM seed_registrations sr
            LEFT JOIN uploads img ON img.entity_type = 'SEED_RECEIPT'
                AND img.entity_id = sr.id AND img.deleted_at IS NULL AND img.display_order = 0
            WHERE sr.deleted_at IS NULL
            ORDER BY sr.created_at DESC
            """;
        return jdbcTemplate.query(sql, rowMapper);
    }
}

