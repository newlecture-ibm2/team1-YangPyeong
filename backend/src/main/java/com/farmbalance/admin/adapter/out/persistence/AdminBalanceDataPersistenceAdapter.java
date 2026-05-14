package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminBalanceDataPort;
import com.farmbalance.admin.domain.AdminBalanceData;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ADM-005 밸런스 엔진 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminBalanceDataPersistenceAdapter implements AdminBalanceDataPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminBalanceData> rowMapper = (rs, rowNum) -> AdminBalanceData.builder()
            .id(rs.getLong("id"))
            .regionCode(rs.getString("region_code"))
            .cropId(rs.getLong("crop_id"))
            .cropName(rs.getString("crop_name"))
            .year(rs.getInt("year"))
            .season(rs.getString("season"))
            .supplyForecast(rs.getBigDecimal("supply_forecast"))
            .demandForecast(rs.getBigDecimal("demand_forecast"))
            .supplyRatio(rs.getBigDecimal("supply_ratio"))
            .balanceStatus(rs.getString("balance_status"))
            .calculatedAt(rs.getTimestamp("calculated_at") != null ? rs.getTimestamp("calculated_at").toLocalDateTime() : null)
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminBalanceData> findAll() {
        String sql = """
            SELECT b.*, c.name as crop_name 
            FROM balance_data b 
            JOIN crops c ON b.crop_id = c.id 
            WHERE b.deleted_at IS NULL 
            ORDER BY b.calculated_at DESC
        """;
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public List<AdminBalanceData> findByRegionAndCrop(String regionCode, Long cropId) {
        String sql = """
            SELECT b.*, c.name as crop_name 
            FROM balance_data b 
            JOIN crops c ON b.crop_id = c.id 
            WHERE b.region_code = ? AND b.crop_id = ? AND b.deleted_at IS NULL 
            ORDER BY b.year DESC, b.season
        """;
        return jdbcTemplate.query(sql, rowMapper, regionCode, cropId);
    }
}
