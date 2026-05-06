package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminDashboardPort;
import com.farmbalance.admin.domain.AdminDashboard;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * ADM-011 관리자 대시보드 통계 집계 Persistence Adapter
 * 여러 테이블을 단일 SQL로 집계하여 KPI 데이터를 반환한다.
 */
@Component
@RequiredArgsConstructor
public class AdminDashboardPersistenceAdapter implements AdminDashboardPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public AdminDashboard aggregateDashboard() {
        String sql = """
            SELECT
                (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'FARMER' AND deleted_at IS NULL) AS total_farmers,
                (SELECT COUNT(*) FROM farms WHERE certification_status = 'PENDING' AND deleted_at IS NULL) AS pending_approvals,
                (SELECT COUNT(*) FROM farms WHERE deleted_at IS NULL) AS total_farms,
                (SELECT COUNT(*) FROM crops WHERE is_active = true) AS total_crops,
                (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) AS total_posts,
                (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) AS total_products,
                (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL) AS total_orders,
                (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE) AS today_registrations
            """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> AdminDashboard.builder()
                .totalUsers(rs.getLong("total_users"))
                .totalFarmers(rs.getLong("total_farmers"))
                .pendingApprovals(rs.getLong("pending_approvals"))
                .totalFarms(rs.getLong("total_farms"))
                .totalCrops(rs.getLong("total_crops"))
                .totalPosts(rs.getLong("total_posts"))
                .totalProducts(rs.getLong("total_products"))
                .totalOrders(rs.getLong("total_orders"))
                .todayRegistrations(rs.getLong("today_registrations"))
                .build());
    }
}
