package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminProductCategoryPort;
import com.farmbalance.admin.domain.AdminProductCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ADM-009 상품 카테고리 조회 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminProductCategoryPersistenceAdapter implements AdminProductCategoryPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminProductCategory> rowMapper = (rs, rowNum) -> AdminProductCategory.builder()
            .id(rs.getLong("id"))
            .name(rs.getString("name"))
            .description(rs.getString("description"))
            .displayOrder(rs.getInt("display_order"))
            .isActive(rs.getBoolean("is_active"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminProductCategory> findAll() {
        String sql = "SELECT * FROM product_categories WHERE deleted_at IS NULL ORDER BY display_order";
        return jdbcTemplate.query(sql, rowMapper);
    }
}
