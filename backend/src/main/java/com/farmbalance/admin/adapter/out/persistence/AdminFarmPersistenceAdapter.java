package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminFarmPort;
import com.farmbalance.admin.domain.AdminFarm;
import com.farmbalance.admin.domain.FarmApprovalView;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-002 농부 승인/반려 Persistence Adapter (JdbcTemplate)
 *
 * [변경 사항] land_cert_image_url 컬럼이 공통 uploads 테이블로 이관됨.
 * uploads 테이블에서 entity_type='FARM_LAND_CERT', entity_id=farm.id로 조회합니다.
 * 도메인 객체의 landCertImageUrl 필드명은 API 하위 호환을 위해 유지합니다.
 */
@Component
@RequiredArgsConstructor
public class AdminFarmPersistenceAdapter implements AdminFarmPort {

    private final JdbcTemplate jdbcTemplate;

    /** farms + uploads LEFT JOIN RowMapper */
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

    /** 승인 목록 뷰용 RowMapper (farms + users + uploads JOIN) */
    private final RowMapper<FarmApprovalView> approvalViewRowMapper = (rs, rowNum) -> FarmApprovalView.builder()
            .farmId(rs.getLong("farm_id"))
            .farmName(rs.getString("farm_name"))
            .address(rs.getString("address"))
            .areaSize(rs.getBigDecimal("area_size"))
            .businessNumber(rs.getString("business_number"))
            .landCertImageUrl(rs.getString("land_cert_image_url"))
            .landCertVerified(rs.getBoolean("land_cert_verified"))
            .status(rs.getString("status"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .userId(rs.getLong("user_id"))
            .userName(rs.getString("user_name"))
            .userEmail(rs.getString("user_email"))
            .userPhone(rs.getString("user_phone"))
            .build();

    @Override
    public List<AdminFarm> findAll() {
        String sql = """
            SELECT f.*,
                   COALESCE(img.file_url, f.land_cert_image_url) AS land_cert_image_url
            FROM farms f
            LEFT JOIN uploads img ON img.entity_type = 'FARM_LAND_CERT'
                AND img.entity_id = f.id AND img.deleted_at IS NULL AND img.display_order = 0
            WHERE f.deleted_at IS NULL
            ORDER BY f.created_at DESC
            """;
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public List<AdminFarm> findByStatus(String status) {
        String sql = """
            SELECT f.*,
                   COALESCE(img.file_url, f.land_cert_image_url) AS land_cert_image_url
            FROM farms f
            LEFT JOIN uploads img ON img.entity_type = 'FARM_LAND_CERT'
                AND img.entity_id = f.id AND img.deleted_at IS NULL AND img.display_order = 0
            WHERE f.status = ? AND f.deleted_at IS NULL
            ORDER BY f.created_at DESC
            """;
        return jdbcTemplate.query(sql, rowMapper, status);
    }

    @Override
    public Optional<AdminFarm> findById(Long id) {
        String sql = """
            SELECT f.*,
                   COALESCE(img.file_url, f.land_cert_image_url) AS land_cert_image_url
            FROM farms f
            LEFT JOIN uploads img ON img.entity_type = 'FARM_LAND_CERT'
                AND img.entity_id = f.id AND img.deleted_at IS NULL AND img.display_order = 0
            WHERE f.id = ? AND f.deleted_at IS NULL
            """;
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

    @Override
    public List<FarmApprovalView> findApprovalsByStatus(String status) {
        String sql = """
            SELECT f.id AS farm_id, f.name AS farm_name, f.address, f.area_size,
                   f.business_number,
                   COALESCE(img.file_url, f.land_cert_image_url) AS land_cert_image_url,
                   f.land_cert_verified,
                   f.status, f.created_at,
                   u.id AS user_id, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM farms f
            JOIN users u ON f.user_id = u.id
            LEFT JOIN uploads img ON img.entity_type = 'FARM_LAND_CERT'
                AND img.entity_id = f.id AND img.deleted_at IS NULL AND img.display_order = 0
            WHERE f.status = ? AND f.deleted_at IS NULL
            ORDER BY f.created_at DESC
            """;
        return jdbcTemplate.query(sql, approvalViewRowMapper, status);
    }
}

