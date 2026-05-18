package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminDashboardPort;
import com.farmbalance.admin.domain.AdminDashboard;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminDashboardPersistenceAdapter implements AdminDashboardPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public AdminDashboard aggregateDashboard() {
        String sql = """
            SELECT
                (SELECT COUNT(*) FROM farms WHERE certification_status = 'PENDING' AND deleted_at IS NULL) AS pending_approvals,
                (SELECT COUNT(*) FROM reports WHERE status = 'PENDING') AS pending_reports,
                (SELECT COUNT(*) FROM users WHERE anonymized_at IS NULL) AS active_users,
                (SELECT COUNT(*) FROM orders WHERE created_at >= (CURRENT_DATE - INTERVAL '7' DAY)) AS weekly_new_orders
            """;

        AdminDashboard partialDashboard = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> AdminDashboard.builder()
                .pendingFarmApprovals(rs.getLong("pending_approvals"))
                .pendingReports(rs.getLong("pending_reports"))
                .activeUsers(rs.getLong("active_users"))
                .weeklyNewOrders(rs.getLong("weekly_new_orders"))
                .build());

        String cropAreaSql = """
            SELECT
                cr.name AS crop_name, SUM(c.cultivation_area) AS total_area
            FROM
                cultivation_registrations c
            JOIN crops cr ON c.crop_id = cr.id
            JOIN farms f ON c.farm_id = f.id
            WHERE f.certification_status = 'APPROVED' AND c.deleted_at IS NULL AND f.deleted_at IS NULL
            GROUP BY cr.name
            ORDER BY SUM(c.cultivation_area) DESC
            LIMIT 5
            """;

        List<AdminDashboard.CropAreaStat> topCrops = jdbcTemplate.query(cropAreaSql, (rs, rowNum) ->
                new AdminDashboard.CropAreaStat(rs.getString("crop_name"), rs.getDouble("total_area")));

        String seedSalesSql = """
            SELECT
                p.name, p.sales_count
            FROM
                products p
            WHERE p.deleted_at IS NULL
            ORDER BY p.sales_count DESC
            LIMIT 5
            """;

        List<AdminDashboard.SeedSalesStat> topSeeds = jdbcTemplate.query(seedSalesSql, (rs, rowNum) ->
                new AdminDashboard.SeedSalesStat(rs.getString("name"), rs.getLong("sales_count")));

        return AdminDashboard.builder()
                .pendingFarmApprovals(partialDashboard.getPendingFarmApprovals())
                .pendingReports(partialDashboard.getPendingReports())
                .activeUsers(partialDashboard.getActiveUsers())
                .weeklyNewOrders(partialDashboard.getWeeklyNewOrders())
                .topCropsByArea(topCrops)
                .topSeedsBySales(topSeeds)
                .build();
    }
}
