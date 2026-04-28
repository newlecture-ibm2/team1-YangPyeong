package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminFarmPort;
import com.farmbalance.admin.domain.AdminFarm;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-002 농부 승인/반려 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminFarmPersistenceAdapter implements AdminFarmPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminFarm> rowMapper = (rs, rowNum) -> AdminFarm.builder()
            .id(rs.getLong("id"))
            .userId(rs.getLong("user_id"))
            .name(rs.getString("name"))
            .address(rs.getString("address"))
            .bjdCode(rs.getString("bjd_code"))
            .pnuCode(rs.getString("pnu_code"))
            .latitude(rs.getBigDecimal("latitude"))
            .longitude(rs.getBigDecimal("longitude"))
            .areaSize(rs.getBigDecimal("area_size"))
            .soilType(rs.getString("soil_type"))
            .businessNumber(rs.getString("business_number"))
            .landCertImageUrl(rs.getString("land_cert_image_url"))
            .landCertVerified(rs.getBoolean("land_cert_verified"))
            .status(rs.getString("status"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminFarm> findAll() {
        String sql = "SELECT * FROM farms WHERE deleted_at IS NULL ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public List<AdminFarm> findByStatus(String status) {
        String sql = "SELECT * FROM farms WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper, status);
    }

    @Override
    public Optional<AdminFarm> findById(Long id) {
        String sql = "SELECT * FROM farms WHERE id = ? AND deleted_at IS NULL";
        List<AdminFarm> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public void updateStatus(Long id, String status) {
        String sql = "UPDATE farms SET status = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, status, id);
    }

    @Override
    public void updateLandCertVerified(Long id, Boolean verified) {
        String sql = "UPDATE farms SET land_cert_verified = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, verified, id);
    }
}
